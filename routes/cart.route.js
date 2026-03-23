import express from "express";
import Cart from "../models/cart.model.js";

const router = express.Router();

router.get("/", (req, res) => {
    return res.render("cart");
});

router.get("/add/:id", async (req, res) => {
    const id = req.params.id;
    const result = await Cart.create({
        userId: req.user._id,
    });
    req.flash("toast", JSON.stringify({ type: "success", message: "Added to cart!" }));
    return res.redirect("/home");
});

export default router;
