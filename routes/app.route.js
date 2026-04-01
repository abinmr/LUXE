import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";

const router = express.Router();

router.use(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (user && !user.isBlocked) {
            console.log("user mounted.");
            req.user = user;
            res.locals.user = user;
        } else {
            res.locals.user = null;
        }

        return next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.clearCookie("token");
        res.locals.user = null;
        return next();
    }
});

router.get("/home", async (req, res) => {
    try {
        let userWishlist = [];
        const categories = await Category.find({ $and: [{ isActive: true, isDeleted: false }] });
        const products = await Product.find({ isDeleted: false, isListed: true });
        let wishlist = null;
        if (req.user) {
            wishlist = await Wishlist.findOne({ userId: req.user._id });
        }
        if (wishlist) {
            userWishlist = wishlist.products.map((item) => item.productId.toString());
        }
        return res.render("home", { categories, products, userWishlist });
    } catch (err) {
        console.error(err);
        return res.render("home");
    }
});

router.get("/product/:id", async (req, res) => {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id });
    const categories = await Category.find({ isActive: true, isDeleted: false });
    const otherProducts = await Product.find({ _id: { $ne: id } }).limit(4);
    let userWishlist = [];
    let wishlist = null;
    if (req.user) {
        wishlist = await Wishlist.findOne({ userId: req.user._id });
    }
    if (wishlist) {
        userWishlist = wishlist.products.map((item) => item.productId.toString());
    }
    return res.render("productDetails", { categories, product, otherProducts, userWishlist });
});

router.get("/search", async (req, res) => {
    const search = req.query.search;
    const categories = await Category.find({ isActive: true, isDeleted: false });
    const products = await Product.find({ name: { $regex: search, $options: "i" } });
    console.log(JSON.stringify(products, null, 2));
    return res.render("productSearch", { categories, products });
});

export default router;
