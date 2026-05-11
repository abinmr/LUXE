import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import { preventLoggedInAdmin, requireAdminAuth, noCache } from "../middlewares/admin-auth.middleware.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { getBestSellingCategories, getBestSellingProducts, getTotalRevenue, monthelyOrders, monthelyRevenue } from "../service/order.service.js";

const router = express.Router();

router.get("/login", noCache, preventLoggedInAdmin, (req, res) => {
    return res.render("admin-login");
});

router.get("/dashboard", requireAdminAuth, async (req, res) => {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments();
    const totalRevenue = await getTotalRevenue();
    const bestSellingProducts = await getBestSellingProducts();
    const bestSellingCategories = await getBestSellingCategories();
    const revenue = await monthelyRevenue();
    const orders = await monthelyOrders();
    return res.render("dashboard", {
        currentPage: "dashboard",
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        bestSellingProducts,
        bestSellingCategories,
        revenueArray: revenue,
        ordersArray: orders,
    });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render("admin-login", { error: "please provide email and password" });
    }

    const user = await Admin.findOne({ email: email });
    if (!user) {
        return res.status(401).render("admin-login", { error: "unauthorized access." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).render("admin-login", { error: "Incorrect email or password" });
    }

    const token = jwt.sign({ adminId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("admin_token", token, { httpOnly: true });

    return res.redirect("/admin/dashboard");
});

router.get("/logout", (req, res) => {
    res.clearCookie("admin_token", { httpOnly: true });
    return res.redirect("/admin/login");
});

export default router;
