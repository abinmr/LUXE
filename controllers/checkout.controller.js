import Address from "../models/address.model.js";
import Cart from "../models/cart.model.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { calcPricing, getCartItems } from "../service/cart.service.js";
import { createOrder } from "../service/checkout.service.js";
import { updateProduct } from "../service/product.service.js";
import { createAddress, findAddresses } from "../service/profile.service.js";
import { badRequest, created, notFound, serverError, success } from "../service/status.service.js";
import razorpay from "../lib/razorpay.js";
import crypto from "crypto";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransation.model.js";

export const getDefaultAddress = async (req, res, next) => {
    try {
        const address = await Address.find({ user: req.user?._id });
        const defaultAddress = address.find((add) => add.isDefault) || address[0];
        res.locals.defaultAddress = defaultAddress;
        next();
    } catch (err) {
        next(err);
    }
};

export const checkoutAddAddress = async (req, res) => {
    try {
        const address = await createAddress(req.body, req.user?._id);
        return res.status(created).json({ success: true, address });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Failed to save address" });
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCheckoutPage = async (req, res) => {
    try {
        const address = await findAddresses(req.user?._id);
        const allCartItems = await getCartItems(req.user?._id);
        const products = allCartItems.filter((item) => item.isSelected);
        const data = calcPricing(products);
        const formattedProducts = products.map(({ itemId, description, isSelected, categoryActive, isListed, stock, compareAtPrice, productImage, ...rest }) => ({
            ...rest,
            productImage: productImage[0],
        }));
        req.session.checkout = {
            source: "cart",
            items: formattedProducts,
            subtotal: data.subtotal,
            gst: data.gst,
            shipping: data.shipping,
            total: data.total,
        };
        const wallet = await Wallet.findOne({ userId: req.user?._id });
        return res.render("checkout", { address, data, products, wallet, razorpayKeyId: process.env.RAZORPAY_API_KEY_ID });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code: code });
        if (!coupon) {
            return res.status(notFound).json({ success: false, message: "Not a valid coupon" });
        }
        const currentDate = new Date();
        if (!coupon.isActive || currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
            return res.status(notFound).json({ success: false, message: "Coupon expired" });
        }

        const checkoutSessoin = req.session.checkout;
        if (checkoutSessoin.subtotal < coupon.minPurchaseAmount) {
            return res.status(badRequest).json({ success: false, message: `Minium purchase of ₹${coupon.minPurchaseAmount} required` });
        }

        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = (checkoutSessoin.subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
        } else if (coupon.discountType === "fixed") {
            discountAmount = coupon.discountValue;
        }

        checkoutSessoin.discount = discountAmount;
        checkoutSessoin.total = checkoutSessoin.subtotal + checkoutSessoin.gst + checkoutSessoin.shipping - discountAmount;
        checkoutSessoin.appliedCoupon = code;

        return res.status(success).json({ success: true, discount: checkoutSessoin.discount, total: checkoutSessoin.total, message: "Coupon applied" });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const checkoutBuyNow = async (req, res) => {
    try {
        const { productId, variantId, sizeId, quantity } = req.body;
        if (!productId || !variantId || !sizeId) {
            req.flash("toast", JSON.stringify({ type: "error", message: "error" }));
            return res.redirect(`/product/${productId}`);
        }

        const product = await Product.findById(productId, { name: 1, isListed: 1, isDeleted: 1, variants: 1 });
        if (!product || !product.isListed) {
            req.flash("home", { type: "error", message: "product no longer available" });
            return res.redirect("/home");
        }
        const variant = product.variants.id(variantId);
        const size = variant.sizes.id(sizeId);
        if (!variant || !size) {
            req.flash("toast", { type: "error", message: "error" });
            return res.redirect(`/product/${productId}`);
        }
        const stock = size.stock;
        if (stock === 0) {
            req.flash("productDetails", { type: "error", message: "out of stock" });
            return res.redirect(`/product/${productId}`);
        }

        const products = [
            {
                productName: product.name,
                quantity: quantity,
                isListed: product.isListed,
                isSelected: true,
                price: size.price,
            },
        ];

        const data = calcPricing(products);

        const address = await findAddresses(req.user?._id);
        req.session.checkout = {
            source: "buy-now",
            items: [
                {
                    productId,
                    variantId,
                    sizeId,
                    productName: product.name,
                    productImage: variant.images[0],
                    color: variant.color,
                    size: size.size,
                    quantity,
                    price: size.price,
                },
            ],
            subtotal: data.subtotal,
            gst: data.gst,
            shipping: data.shipping,
            total: data.total,
        };
        let wallet = await Wallet.findOne({ userId: req.user?._id });
        if (!wallet) {
            wallet = "00.00";
        }
        return res.render("checkout", { address, products, data, wallet, razorpayKeyId: process.env.RAZORPAY_API_KEY_ID });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const checkoutPlaceOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;
        if (!addressId || !paymentMethod) {
            return res.status(badRequest).json({ success: false, message: "error processing request" });
        }

        if (!["cod", "upi", "credit", "wallet"].includes(paymentMethod)) {
            return res.status(badRequest).json({ success: false, message: "Payment method not supported" });
        }

        const checkout = req.session.checkout;
        if (!checkout) {
            return res.status(badRequest).json({ success: false, message: "Session expired" });
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(badRequest).json({ success: false, message: "Address not found" });
        }

        const order = await createOrder(req, checkout, address, paymentMethod);

        if (order) {
            for (const item of checkout.items) {
                const result = await updateProduct(item.productId, item.variantId, item.sizeId, -item.quantity);
                if (result.modifiedCount === 0) {
                    return res.status(badRequest).json({ success: false, message: "error" });
                }
            }
        }

        if (checkout.source === "cart") {
            const cart = await Cart.findOne({ userId: req.user._id });
            const seletedIds = cart.items.map((item) => item.sizeId._id.toString());
            await Cart.updateOne(
                {
                    userId: req.user._id,
                },
                {
                    $pull: {
                        items: {
                            isSelected: true,
                            sizeId: { $in: seletedIds },
                        },
                    },
                },
            );
        }

        if (paymentMethod === "wallet") {
            const wallet = await Wallet.findOne({ userId: req.user?._id });
            if (!wallet || wallet.balance < checkout.total) {
                return res.status(badRequest).json({ success: false, message: "Insufficient wallet balance" });
            }
            wallet.balance -= checkout.total;
            wallet.balance.toFixed(2);
            await wallet.save();
            const walletTransaction = await WalletTransaction.create({
                walletId: wallet._id,
                userId: req.user?._id,
                transactionType: "debit",
                amount: checkout.total,
                description: "paid for order",
                status: "completed",
            });
        }

        if (paymentMethod === "upi" || paymentMethod === "credit") {
            const options = {
                amount: Math.round(checkout.total * 100),
                currency: "INR",
                receipt: order.orderId,
            };
            const razorpayOrder = await razorpay.orders.create(options);
            return res.status(success).json({ success: true, order: order._id, razorpayOrderId: razorpayOrder.id, amount: options.amount });
        }

        delete req.session.checkout;
        return res.status(success).json({ success: true, order: order._id });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: err });
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCheckoutSuccessPage = async (req, res) => {
    const id = req.query.orderId;
    const order = await Order.findOne({ _id: id });
    return res.render("checkoutSuccess", { order });
};

export const checkoutFailurePage = (req, res) => {
    return res.render("checkoutFail");
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_API_SECRET).update(sign.toString()).digest("hex");

        if (razorpay_signature === expectedSign) {
            await Order.updateOne({ _id: orderId }, { $set: { "items.$[].paymentStatus": "paid" } });
            return res.status(success).json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(badRequest).json({ success: false, message: "Invalid signature" });
        }
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Internal Server Error" });
    }
};
