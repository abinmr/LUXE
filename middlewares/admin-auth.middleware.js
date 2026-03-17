import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const preventLoggedInAdmin = async (req, res, next) => {
    const token = req.cookies.admin_token;
    if (!token) {
        return next();
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Admin is already logged in: ", decodedToken);
        return res.redirect("/admin/dashboard");
    } catch (err) {
        res.clearCookie("admin_token", { httpOnly: true });
        console.error("Invalid token on login page:", err);
        return next();
    }
};

export const requireAdminAuth = async (req, res, next) => {
    const token = req.cookies.admin_token;
    if (!token) {
        return res.redirect("/admin/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const adminExists = await Admin.findById(decoded.adminId).select("-password");

        if (!adminExists) {
            return res.redirect("/admin/login");
        }
        // console.log("Admin: ", adminExists);
        req.admin = adminExists;
        return next();
    } catch (err) {
        return res.redirect("/admin/login");
    }
};

export const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
};
