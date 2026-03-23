import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

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
        const categories = await Category.find({ $and: [{ isActive: true, isDeleted: false }] });
        const products = await Product.find({ isDeleted: false, isListed: true });
        res.render("home", { categories, products });
    } catch (err) {
        console.error(err);
        return res.render("home");
    }
});

router.get("/product/:id", async (req, res) => {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id });
});

export default router;
