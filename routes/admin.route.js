import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import { preventLoggedInAdmin, requireAdminAuth, noCache } from "../middlewares/admin-auth.middleware.js";

const router = express.Router();

router.get("/login", noCache, preventLoggedInAdmin, (req, res) => {
    return res.render("admin-login");
});

router.get("/dashboard", requireAdminAuth, (req, res) => {
    return res.render("dashboard", { currentPage: "dashboard" });
});

router.get("/products", requireAdminAuth, (req, res) => {
    return res.render("products", { currentPage: "products" });
});

router.get("/categories", requireAdminAuth, (req, res) => {
    return res.render("categories", { currentPage: "categories" });
});

router.get("/orders", requireAdminAuth, (req, res) => {
    return res.render("orders", { currentPage: "orders" });
});

router.get("/customers", requireAdminAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";
    const selectStatus = req.query.customerStatus;
    let dbQuery = {};
    if (searchQuery) {
        dbQuery = {
            $or: [{ fullname: { $regex: searchQuery, $options: "i" } }, { email: { $regex: searchQuery, $options: "i" } }],
        };
    }

    if (selectStatus === "active") {
        dbQuery.isBlocked = false;
    } else if (selectStatus === "blocked") {
        dbQuery.isBlocked = true;
    }
    const userDetails = await User.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(6);
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const userInfo = {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        revenue: userDetails.total || 0,
        status: selectStatus,
    };
    const totalPages = Math.ceil(totalUsers / limit);
    return res.render("customers", {
        users: userDetails,
        userInfo: userInfo,
        currentPageNumber: page,
        totalPages: totalPages,
        limit: limit,
        search: searchQuery,
    });
});

router.post("/customers/block/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (user) {
            user.isBlocked = !user.isBlocked;
            await user.save();
        }

        return res.redirect("/api/admin/customers");
    } catch (err) {
        console.error("Error toggling block status:", err);
        return res.redirect("/api/admin/customers");
    }
});

router.get("/customers/filter", (req, res) => {
    const status = req.body;
    console.log("Status: ", status);
    console.log("code ran");
    return res.redirect("/api/admin/customers");
});

router.get("/coupons", requireAdminAuth, (req, res) => {
    return res.render("coupons", { currentPage: "coupons" });
});

router.get("/sales-report", requireAdminAuth, (req, res) => {
    return res.render("sales-report", { currentPage: "sales-report" });
});

router.get("/offers", requireAdminAuth, (req, res) => {
    return res.render("offers", { currentPage: "offers" });
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

    const token = jwt.sign({ adminId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("admin_token", token, { httpOnly: true });

    return res.redirect("/api/admin/dashboard");
});

router.get("/logout", (req, res) => {
    res.clearCookie("admin_token", { httpOnly: true });
    return res.redirect("/api/admin/login");
});

export default router;
