import express from "express";
import Wishlist from "../models/wishlist.model.js";
import Category from "../models/category.model.js";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true, isDeleted: false });
        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("products.productId");
        // console.log(JSON.stringify(wishlist, null, 2));
        res.render("wishlist", { categories, wishlist });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
});

router.get("/add/:id", protectedRoute, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (!wishlist) {
            await Wishlist.create({ userId: req.user._id, products: [{ productId: req.params.id }] });
        } else {
            const isAvailable = wishlist.products.some((p) => p.productId.toString() === req.params.id);
            if (!isAvailable) {
                wishlist.products.push({ productId: req.params.id });
                await wishlist.save();
            } else {
                console.log("already in wishlist");
                return res.status(409).json({ success: false, message: "product already in wishlist" });
            }
        }
        req.flash("toast", JSON.stringify({ type: "success", message: "Added to wishlist" }));
        return res.status(200).json({ success: true, message: "Add to wishlist" });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
});

router.delete("/delete/:id", protectedRoute, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (wishlist) {
            wishlist.products = wishlist.products.filter((p) => p.productId.toString() !== req.params.id);
            wishlist.save();
        }
        return res.status(200).json({ success: true, message: "item removed" });
    } catch (err) {
        console.error(err);
        return res.redirect("/");
    }
});

export default router;
