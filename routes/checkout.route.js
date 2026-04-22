import express from "express";
import { customAlphabet } from "nanoid";
import Address from "../models/address.model.js";
import Product from "../models/product.model.js";
import { calcPricing, getCartItems } from "../service/cart.service.js";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

/**
 * @typedef {Object} CheckoutItem
 * @property {string} productId
 * @property {string} variantId
 * @property {string} sizeId
 * @property {string} productName
 * @property {string} images
 * @property {string} color
 * @property {string} size
 * @property {number} quantity
 * @property {number} price
 */

/**
 * @typedef {Object} CheckoutSession
 * @property {"buy-now" | "cart"} source
 * @property {CheckoutItem[]} items
 * @property {number} subtotal
 * @property {number} discount
 * @property {number} gst
 * @property {number} shipping
 * @property {number} total
 */

router.use(async (req, res, next) => {
    try {
        const address = await Address.find({ user: req.user?._id });
        const defaultAddress = address.find((add) => add.isDefault) || address[0];
        res.locals.defaultAddress = defaultAddress;
        next();
    } catch (err) {
        next(err);
    }
});

router.get("/", async (req, res) => {
    try {
        const address = await Address.find({ user: req.user._id });
        return res.render("checkout", { address });
    } catch (err) {
        console.error(err);
    }
});

router.post("/", protectedRoute, async (req, res) => {
    try {
        const address = await Address.find({ user: req.user?._id });
        const products = await getCartItems(req.user?._id);
        const data = calcPricing(products);
        req.session.checkout = {
            source: "cart",
            items: [],
        };
        return res.render("checkout", { address, data, products });
    } catch (err) {
        console.error(err);
    }
});

router.post("/buy-now", protectedRoute, async (req, res) => {
    console.log(req.body);

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

    const address = await Address.find({ user: req.user._id });
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
        discount: 0,
        gst: data.gst,
        shipping: data.shipping,
        total: data.total,
    };
    return res.render("checkout", { address, products, data });
});

router.post("/place-order", async (req, res) => {
    const { addressId, paymentMethod } = req.body;
    if (!addressId || !paymentMethod) {
        return res.redirect("/checkout");
    }

    /** @type {CheckoutSession} */
    const checkout = req.session.checkout;
    if (!checkout) {
        return res.status(400).json({ success: false, message: "Session expired" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
        return res.status(400).json({ success: false, message: "Address not found" });
    }

    for (const item of checkout.items) {
        const result = await Product.updateOne(
            {
                _id: item.productId,
                "variants._id": item.variantId,
            },
            {
                $inc: {
                    "variants.$[v].sizes.$[s].stock": -item.quantity,
                },
            },
            {
                arrayFilters: [{ "v._id": item.variantId }, { "s._id": item.sizeId }],
            },
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: "error" });
        }
    }

    const nanoid = customAlphabet("1234567890", 12);

    const order = await Order.create({
        userId: req.user?._id,
        orderId: Number(nanoid()),
        items: checkout.items,
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        GST: checkout.gst,
        shipping: checkout.shipping,
        total: checkout.total,
        shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            pincode: address.pincode,
            houseNumber: address.houseNumber,
            street: address?.street,
            city: address.city,
            state: address.state,
        },
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        orderStatus: "pending",
        estimatedDeliveryDate: Date.now(Date.now(1000 * 60 * 60 * 24 * 3)),
    });

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

    delete req.session.checkout;

    return res.status(200).json({ success: true, order: order._id });
});

router.get("/success", async (req, res) => {
    const id = req.query.orderId;
    const order = await Order.findOne({ _id: id });
    return res.render("checkoutSuccess", { order });
});

router.get("/failure", (req, res) => {
    return res.render("checkoutFail");
});

export default router;
