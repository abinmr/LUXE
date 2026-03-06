import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const redirectIfAuth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return next();
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.redirect("/home");
    } catch (err) {
        console.error(err);
        return next();
    }
};

export const protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/api/auth/login?error=Please login first");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.redirect("/api/auth/login?error=User not found.");
        }

        if (user.isBlocked) {
            return res.redirect("/api/auth/login?error=You are blocked from accessing this site.");
        }

        req.user = user;
        next();
    } catch (err) {
        console.error(err);
    }
};

export const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
};
