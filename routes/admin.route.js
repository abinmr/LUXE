import express from "express";
import bcrypt from "bcrypt";
import AdminModel from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import { preventLoggedInAdmin, requireAdminAuth, noCache } from "../middlewares/admin-auth.middleware.js";

const adminRouter = express.Router();

adminRouter.get("/login", noCache, preventLoggedInAdmin, (req, res) => {
    return res.render("admin-login");
});

adminRouter.get("/dashboard", requireAdminAuth, (req, res) => {
    return res.render("dashboard", { currentPage: "dashboard" });
});

adminRouter.get("/products", requireAdminAuth, (req, res) => {
    return res.render("products", { currentPage: "products" });
});

adminRouter.get("/categories", requireAdminAuth, (req, res) => {
    return res.render("categories", { currentPage: "categories" });
});

adminRouter.get("/orders", requireAdminAuth, (req, res) => {
    return res.render("orders", { currentPage: "orders" });
});

adminRouter.get("/customers", requireAdminAuth, (req, res) => {
    return res.render("customers", { currentPage: "customers" });
});

adminRouter.get("/coupons", requireAdminAuth, (req, res) => {
    return res.render("coupons", { currentPage: "coupons" });
});

adminRouter.get("/sales-report", requireAdminAuth, (req, res) => {
    return res.render("sales-report", { currentPage: "sales-report" });
});

adminRouter.get("/offers", requireAdminAuth, (req, res) => {
    return res.render("offers", { currentPage: "offers" });
});

adminRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render("admin-login", { error: "please provide email and password" });
    }

    const user = await AdminModel.findOne({ email: email });
    if (!user) {
        return res.status(401).render("admin-login", { error: "unauthorized access." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).render("admin-login", { error: "Incorrect email or password" });
    }

    const token = jwt.sign({ adminId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });

    return res.redirect("/api/admin/dashboard");
});

adminRouter.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true });
    return res.redirect("/api/admin/login");
});

export default adminRouter;
