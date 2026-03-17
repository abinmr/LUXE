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
            req.flash("loginError", "Please login first");
            return res.redirect("/auth/login");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            req.flash("loginError", "User not found");
            return res.redirect("/auth/login");
        }

        if (user.isBlocked) {
            req.flash("loginError", "You are blocked from accessing this website");
            return res.redirect("/auth/login");
        }

        req.user = user;
        next();
    } catch (err) {
        console.error(err);
    }
};

export const checkUser = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (user && !user.isBlocked) {
            req.user = user;
            res.locals.user = user;
        } else {
            res.locals.user = null;
        }

        return next();
    } catch (err) {
        res.locals.user = null;
        return next();
    }
};

export const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
};
