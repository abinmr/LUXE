import express from "express";
import bcrypt from "bcrypt";
import AdminModel from "../models/admin.model.js";

const adminRouter = express.Router();

adminRouter.get("/login", (req, res) => {
    return res.render("admin-login");
});

adminRouter.get("/dashboard", (req, res) => {
    return res.render("dashboard", { currentPage: "dashboard" });
});

adminRouter.get("/products", (req, res) => {
    return res.render("products", { currentPage: "products" });
});

adminRouter.get("/categories", (req, res) => {
    return res.render("categories", { currentPage: "categories" });
});

adminRouter.get("/orders", (req, res) => {
    return res.render("orders", { currentPage: "orders" });
});

adminRouter.get("/customers", (req, res) => {
    return res.render("customers", { currentPage: "customers" });
});

adminRouter.get("/coupons", (req, res) => {
    return res.render("coupons", { currentPage: "coupons" });
});

adminRouter.get("/sales-report", (req, res) => {
    return res.render("sales-report", { currentPage: "sales-report" });
});

adminRouter.get("/offers", (req, res) => {
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

    res.redirect("/api/admin/dashboard");
});

export default adminRouter;
