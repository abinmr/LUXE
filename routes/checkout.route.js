import express from "express";
import Address from "../models/address.model.js";

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
        console.log("ran");
        console.log(address);
        return res.render("checkout", { address });
    } catch (err) {
        console.error(err);
    }
});

router.post("/", async (req, res) => {
    try {
        const address = await Address.find({ user: req.user._id });
        return res.render("checkout", { address });
    } catch (err) {
        console.error(err);
    }
});

router.post("/buy-now", async (req, res) => {
    const { productId, variantId, sizeId } = req.body;
    const address = await Address.find({ user: req.user._id });
    console.log(productId, variantId, sizeId);
    return res.render("checkout", { address });
});

router.get("/success", (req, res) => {
    return res.render("checkoutSuccess");
});

router.get("/failure", (req, res) => {
    return res.render("checkoutFail");
});

export default router;
