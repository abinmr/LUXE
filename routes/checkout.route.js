import express from "express";
import Address from "../models/address.model.js";
import Product from "../models/product.model.js";
import { calcPricing, getCartItems } from "../service/cart.service.js";

const router = express.Router();

router.use(async (req, res, next) => {
    try {
        const address = await Address.find({ user: req.user._id });
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

router.post("/", async (req, res) => {
    try {
        const address = await Address.find({ user: req.user._id });
        const products = await getCartItems(req.user?._id);
        const data = calcPricing(products);
        return res.render("checkout", { address, data, products });
    } catch (err) {
        console.error(err);
    }
});

router.post("/buy-now", async (req, res) => {
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
    console.log(data);

    const address = await Address.find({ user: req.user._id });
    return res.render("checkout", { address, products, data });
});

router.get("/success", (req, res) => {
    return res.render("checkoutSuccess");
});

router.get("/failure", (req, res) => {
    return res.render("checkoutFail");
});

export default router;
