import express from "express";
import Address from "../models/address.model.js";

const router = express.Router();

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
        const defaultAddress = address.find((add) => add.isDefault) || address[0];
        return res.render("checkout", { defaultAddress, address });
    } catch (err) {
        console.error(err);
    }
});

router.get("/success", (req, res) => {
    return res.render("checkoutSuccess");
});

router.get("/failure", (req, res) => {
    return res.render("checkoutFail");
});

export default router;
