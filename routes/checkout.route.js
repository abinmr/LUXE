import express from "express";
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
 * @property {number} quantity
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

    const product = await Product.findOne({ "variants.sizes._id": sizeId }, { name: 1, isListed: 1, "variants.sizes.$": 1 });
    if (!product.isListed) {
        req.flash("home", { type: "error", message: "product no longer available" });
        return res.redirect("/home");
    }
    const stock = product.variants[0]?.sizes[0]?.stock;
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
            price: product.variants[0].sizes[0].price,
        },
    ];

    const data = calcPricing(products);

    const address = await Address.find({ user: req.user._id });
    req.session.checkout = {
        source: "buy-now",
        items: [{ productId, variantId, sizeId, quantity }],
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

    const order = await Order.create({
        userId: req.user?._id,
        items: checkout.items,
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        GST: checkout.gst,
        shipping: checkout.shipping,
        total: checkout.total,
        shippingAddress: address,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "code" ? "pending" : "paid",
        orderStatus: "pending",
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

router.get("/success", (req, res) => {
    return res.render("checkoutSuccess");
});

router.get("/failure", (req, res) => {
    return res.render("checkoutFail");
});

export default router;
