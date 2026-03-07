import express from "express";
import jwt from "jsonwebtoken";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import Address from "../models/address.model.js";
import User from "../models/user.model.js";

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

router.get("/home", (req, res) => {
    res.render("home");
});

router.get("/profile", protectedRoute, async (req, res) => {
    const currentSection = req.query.section || "profile";
    const addresses = await Address.find();
    res.render("profile", { section: currentSection, addresses: addresses });
});

router.post("/profile/update-profile", async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }

        const { fullname, email, phone } = req.body;

        const updateDetails = await User.updateOne({ _id: req.user._id }, { fullname: fullname, email: email, phone: phone });
        console.log(updateDetails);

        return res.redirect("/profile?section=profile");
    } catch (err) {
        console.err("Error updating user profile:", err);
    }
});

router.post("/profile/add-address", async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullName, phone, pincode, house, street, city, state, isDefault } = req.body;

        const newAddress = await Address.create({
            user: req.user._id,
            fullName: fullName,
            phone: phone,
            pincode: pincode,
            houseNumber: house,
            street: street,
            city: city,
            state: state,
            isDefault: isDefault === "on" ? true : false,
        });

        newAddress.save();

        res.redirect("/profile?section=address");
    } catch (err) {
        console.error("Error saving address:", err);
        return res.redirect("/profile?section=address");
    }
});

router.get("/profile/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true });
    return res.redirect("/home");
});

export default router;
