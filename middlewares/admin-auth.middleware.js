import jwt from "jsonwebtoken";

export const preventLoggedInAdmin = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return next();
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return res.redirect("/api/admin/dashboard");
    } catch (err) {
        console.error(err);
        return next();
    }
};

export const requireAdminAuth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/api/admin/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        return next();
    } catch (err) {
        return res.redirect("/api/admin/login");
    }
};

export const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
};
