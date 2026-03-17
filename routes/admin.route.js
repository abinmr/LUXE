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

router.get("/orders", requireAdminAuth, (req, res) => {
    return res.render("orders", { currentPage: "orders" });
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

    return res.redirect("/admin/dashboard");
});

router.get("/logout", (req, res) => {
    res.clearCookie("admin_token", { httpOnly: true });
    return res.redirect("/admin/login");
});

export default router;
