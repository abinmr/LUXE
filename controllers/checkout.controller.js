import crypto from "crypto";
import { calcPricing, getCartItems, getUserCart, removeSelectedItemsFromCart } from "../service/cart.service.js";
import { createOrder } from "../service/checkout.service.js";
import { updateProduct } from "../service/product.service.js";
import { badRequest, conflict, created, notFound, serverError, success } from "../service/status.service.js";
import razorpay from "../lib/razorpay.js";
import { createAddress, findAddressById, findAddresses } from "../service/address.service.js";
import { createWalletTransaction, getUserWallet } from "../service/wallet.service.js";
import { getOrderById, updateOrder } from "../service/order.service.js";
import { getProductById } from "../service/home.service.js";
import { getCouponsDetails, getValidCoupons } from "../service/coupon.service.js";

export const getDefaultAddress = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            next();
        }
        const address = await findAddresses(req.user?._id);
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
        if (!products || products.length === 0) {
            req.flash("home", { type: "error", message: "select atleast 1 item to continue" });
            return res.redirect("/home");
        }

        const data = calcPricing(products);
        const formattedProducts = products.map(({ itemId, description, isSelected, categoryActive, isListed, stock, compareAtPrice, productImage, ...rest }) => ({
            ...rest,
            productImage: productImage[0],
        }));

        if (!products[0].isListed || !products[0].categoryActive) {
            req.flash("home", { type: "error", message: "product no longer available" });
            return res.redirect("/home");
        }
        req.session.checkout = {
            source: "cart",
            items: formattedProducts,
            subtotal: data.subtotal,
            gst: data.gst,
            shipping: data.shipping,
            total: data.total,
        };

        const wallet = await getUserWallet(req.user?._id);
        const coupons = await getValidCoupons();
        return res.render("checkout", { address, data, products, wallet, razorpayKeyId: process.env.RAZORPAY_API_KEY_ID, coupons });
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
        const coupon = await getCouponsDetails(code);
        if (!coupon) {
            return res.status(notFound).json({ success: false, message: "Not a valid coupon" });
        }

        const couponUsed = coupon.users.includes(req.user?._id);
        if (couponUsed) {
            return res.status(conflict).json({ success: false, message: "coupon already used before" });
        }

        if (coupon.usageLimit >= coupon.users.length) {
            return res.status(conflict).json({ success: false, message: "coupon limit reached" });
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
export const removeCoupon = async (req, res) => {
    try {
        const checkoutSession = req.session.checkout;
        if (!checkoutSession) {
            return res.status(badRequest).json({ success: false, message: "No active session available" });
        }

        checkoutSession.discount = 0;
        checkoutSession.total = checkoutSession.subtotal + checkoutSession.gst + checkoutSession.shipping;
        checkoutSession.appliedCoupon = null;

        return res.status(success).json({ success: true, message: "Coupon removed", total: checkoutSession.total });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "something went wrong" });
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

        const product = await getProductById(productId, { name: 1, isListed: 1, isdeleted: 1, variants: 1, category: 1 });
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
                    categoryId: product.category,
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
        const wallet = await getUserWallet(req.user?._id);
        const coupons = await getValidCoupons();
        return res.render("checkout", { address, products, data, wallet, razorpayKeyId: process.env.RAZORPAY_API_KEY_ID, coupons });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
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

        if (!["cod", "online", "wallet"].includes(paymentMethod)) {
            return res.status(badRequest).json({ success: false, message: "Payment method not supported" });
        }

        const checkout = req.session.checkout;
        if (!checkout) {
            return res.status(badRequest).json({ success: false, message: "Session expired" });
        }

        const address = await findAddressById(addressId);
        if (!address) {
            return res.status(badRequest).json({ success: false, message: "Address not found" });
        }

        for (const item of checkout.items) {
            const product = await getProductById(item.productId);
            if (!product) return res.status(badRequest).json({ success: false, message: "Product not found" });
            const variant = product.variants.id(item.variantId);
            const size = variant.sizes.id(item.sizeId);
            if (!size || size.stock < item.quantity) {
                return res.status(badRequest).json({ success: false, message: `Insufficient stock for ${item.productName}` });
            }
        }

        const order = await createOrder(req, checkout, address, paymentMethod);

        if (checkout.appliedCoupon) {
            const coupon = await getCouponsDetails(checkout.appliedCoupon);
            coupon.users.push(req.user?._id);
            await coupon.save();
        }
        if (paymentMethod !== "online") {
            if (order) {
                for (const item of checkout.items) {
                    await updateProduct(item.productId, item.variantId, item.sizeId, -item.quantity);
                }
            }

            if (checkout.source === "cart") {
                const cart = await getUserCart(req.user?._id);
                const seletedIds = cart.items.map((item) => item.sizeId._id.toString());
                await removeSelectedItemsFromCart(req.user?._id, seletedIds);
            }
        }

        if (paymentMethod === "wallet") {
            const wallet = await getUserWallet(req.user?._id);
            if (!wallet || wallet.balance < checkout.total) {
                return res.status(badRequest).json({ success: false, message: "Insufficient wallet balance" });
            }
            wallet.balance = Math.round((wallet.balance - checkout.total) * 100) / 100;
            await wallet.save();
            const walletTransaction = await createWalletTransaction({
                walletId: wallet._id,
                userId: req.user?._id,
                transactionType: "debit",
                amount: checkout.total,
                description: "paid for order",
                status: "completed",
            });
        }

        if (paymentMethod === "online") {
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
    try {
        const id = req.query.orderId;
        const order = await getOrderById(id);
        return res.render("checkoutSuccess", { order });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const checkoutFailurePage = async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.redirect("/home");
        }

        const order = await updateOrder(id, { $set: { paymentStatus: "failed" } });
        if (!order) {
            return res.redirect("/home");
        }
        return res.render("checkoutFail", { order });
    } catch (err) {
        console.error(err);
    }
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
            const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
            const exactMethod = paymentDetails.method;

            const order = await getOrderById(orderId);
            if (order && order.paymentStatus !== "paid") {
                for (const item of order.items) {
                    await updateProduct(item.productId, item.variantId, item.sizeId, -item.quantity);
                }

                const selectedIds = order.items.map((item) => item.sizeId.toString());
                await removeSelectedItemsFromCart(order.userId, selectedIds);
            }

            await updateOrder(orderId, { $set: { paymentStatus: "paid", paymentMethod: exactMethod } });
            return res.status(success).json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(badRequest).json({ success: false, message: "Invalid signature" });
        }
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const retryPayment = async (req, res) => {
    try {
        const id = req.params.id;
        const order = await getOrderById(id);
        if (!order || !["pending", "failed"].includes(order.paymentStatus)) {
            return res.status(badRequest).json({ success: false, message: "Order cannot be retried" });
        }

        for (const item of order.items) {
            const product = await getProductById(item.productId);
            if (!product) return res.status(badRequest).json({ success: false, message: "Product not found" });
            const variant = product.variants.id(item.variantId);
            const size = variant.sizes.id(item.sizeId);
            if (!size || size.stock < item.quantity) {
                return res.status(badRequest).json({ success: false, message: `Insufficient stock for ${item.productName}` });
            }
        }

        const options = {
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: order.orderId,
        };
        const razorpayOrder = await razorpay.orders.create(options);
        return res.status(success).json({ success: true, order: order._id, razorpayKeyId: process.env.RAZORPAY_API_KEY_ID, razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount });
    } catch (err) {
        console.error(err);
    }
};
