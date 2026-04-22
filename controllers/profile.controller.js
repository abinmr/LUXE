import bcrypt from "bcrypt";
import fs from "fs";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import cloudinary from "../lib/cloudinary.js";
import { sendOtpVerification } from "./userAuth.controller.js";
import Otp from "../models/otp.model.js";
import Order from "../models/order.model.js";

export const getProfile = async (req, res) => {
    try {
        const currentSection = req.query.section || "profile";
        const toast = req.flash("toast")[0];
        const phoneError = req.flash("addressError")[0];
        let addresses = [];
        let orders = [];
        if (currentSection === "address") {
            addresses = await Address.find({ user: req.user._id }).sort({ createdAt: -1 });
        }
        if (currentSection === "order-history") {
            orders = await Order.find({ userId: req.user?._id });
        }
        res.render("profile", {
            section: currentSection,
            addresses: addresses,
            toast: toast ? JSON.parse(toast) : null,
            phoneError: phoneError,
            user: req.user,
            orders: orders,
        });
    } catch (err) {
        console.error("Error rendering profile.", err);
        return res.redirect("/profile?section=profile");
    }
};

export const updateProfile = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullname, email, phone } = req.body;

        if (!fullname) {
            req.flash("toast", JSON.stringify({ type: "error", message: "full name is required" }));
            return res.redirect("/profile?section=profile");
        }

        if (!email) {
            req.flash("toast", JSON.stringify({ type: "error", message: "email is required" }));
            return res.redirect("/profile?section=profile");
        }

        const updateData = { fullname, email, phone };
        const file = req.file;
        if (file) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "profile",
                allowed_formats: ["jpg", "png", "webp"],
            });
            await fs.promises.unlink(file.path).catch((err) => console.error(err));
            updateData.profile = result.secure_url;
        }

        const currentUser = await User.findById(req.user._id);
        if (email !== currentUser.email) {
            req.session.pendingProfileUpdate = { fullname, email, phone, profile: updateData.profile };
            await Otp.deleteMany({ userId: currentUser._id });
            await sendOtpVerification(req.user._id, email);
            return res.redirect("/profile/verify-email-otp");
        }

        const updateDetails = await User.updateOne({ _id: req.user._id }, updateData);

        if (updateDetails) {
            req.flash("toast", JSON.stringify({ type: "success", message: "Details updated" }));
        }

        return res.redirect("/profile?section=profile");
    } catch (err) {
        req.flash("toast", JSON.stringify({ type: "error", message: "profile update failed" }));
        console.error("Error updating user profile:", err);
        return res.redirect("/profile?section=profile");
    }
};

export const getEmailOtpPage = async (req, res) => {
    const profileDetails = req.session.pendingProfileUpdate;
    if (!profileDetails) {
        req.flash("toast", JSON.stringify({ type: "error", message: "Verification failed" }));
        return res.redirect("/profile?section=profile");
    }
    const userId = req.user._id;

    if (!userId) {
        req.flash("toast", JSON.stringify({ type: "error", message: "Verification failed" }));
        return res.redirect("/profile?section=profile");
    }
    const otpRecord = await Otp.findOne({ userId: userId });

    const error = req.flash("profileError")[0];
    let secondsLeft = 0;
    if (otpRecord) {
        secondsLeft = Math.floor((otpRecord.expiresAt - Date.now()) / 1000);
        secondsLeft = Math.max(0, secondsLeft);
    }
    return res.render("profileOtp", { secondsLeft, error });
};

export const verifyEmailOtp = async (req, res) => {
    const { otp } = req.body;
    const pendingUpdate = req.session.pendingProfileUpdate;
    if (!pendingUpdate) {
        req.flash("toast", JSON.stringify({ type: "error", message: "Verification failed" }));
        return res.redirect("/profile?section=profile");
    }
    const otpDetails = await Otp.findOne({ userId: req.user._id });
    const isMatch = await bcrypt.compare(otp, otpDetails.otp);
    if (!isMatch) {
        req.flash("profileError", "Invalid otp");
        return res.redirect("/profile/verify-email-otp");
    }
    await User.updateOne({ _id: req.user._id }, pendingUpdate);
    delete req.session.pendingProfileUpdate;
    req.flash("toast", JSON.stringify({ type: "success", message: "profile updated" }));
    return res.redirect("/profile?section=profile");
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
        return res.redirect("/profile?section=password");
    }
    try {
        const user = await User.findOne({ _id: req.user._id });
        console.log("User: ", user);
        if (user) {
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                console.log("Password is wrong");
                req.flash("toast", JSON.stringify({ type: "error", message: "Wrong password" }));
                return res.redirect("/profile?section=password");
            }

            const newHashPassword = await bcrypt.hash(newPassword, 10);
            const updateResult = await User.findByIdAndUpdate(req.user._id, { password: newHashPassword });
            console.log("update success:", updateResult);
            req.flash("toast", JSON.stringify({ type: "success", message: "Password Updated" }));
            return res.redirect("/profile?section=password");
        } else {
            req.flash("toast", JSON.stringify({ type: "error", message: "User not found" }));
            return res.redirect("/profile?section=password");
        }
    } catch (err) {
        req.flash("toast", JSON.stringify({ type: "error", message: "Error in changing password" }));
        console.error("Error in changing password", err);
        return res.redirect("/profile?section=password");
    }
};

export const addAddress = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullName, phone, pincode, house, street, city, state, isDefault } = req.body;

        const makeDefault = isDefault === "on" || isDefault === "true";

        if (fullName === "" || phone === "" || pincode === "" || house === "" || state === "") {
            req.flash("toast", JSON.stringify({ type: "error", message: "Address failed to save" }));
            return res.redirect("/profile?section=address");
        }

        const regex = /^\d{10}$/;

        if (!regex.test(phone)) {
            req.flash("addressError", "Please enter a valid phone");
            return res.redirect("/profile?section=address");
        }

        if (makeDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const newAddress = await Address.create({
            user: req.user._id,
            fullName: fullName,
            phone: phone,
            pincode: Number(pincode),
            houseNumber: house,
            street: street,
            city: city,
            state: state,
            isDefault: isDefault === "on" ? true : false,
        });

        await newAddress.save();

        req.flash("toast", JSON.stringify({ type: "success", message: "Address created" }));
        res.redirect("/profile?section=address");
    } catch (err) {
        console.error("Error saving address:", err);
        return res.redirect("/profile?section=address");
    }
};

export const editAddress = async (req, res) => {
    const addressId = req.params.id;
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullName, phone, pincode, house, street, city, state, isDefault } = req.body;

        const makeDefault = isDefault === "on" || isDefault === "true";

        if (makeDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const updateResult = await Address.findByIdAndUpdate(addressId, {
            fullName: fullName,
            phone: phone,
            pincode: pincode,
            houseNumber: house,
            street: street,
            city: city,
            state: state,
            isDefault: makeDefault,
        });
        if (updateResult) {
            req.flash("toast", JSON.stringify({ type: "success", message: "Address updated" }));
            return res.redirect("/profile?section=address");
        }
    } catch (err) {
        console.error("Error updating address:", err);
        req.flash("toast", JSON.stringify({ type: "error", message: "Update failed" }));
        return res.redirect("/profile?section=address");
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const deleteResult = await Address.deleteOne({ _id: addressId });
        if (deleteResult) {
            req.flash("toast", JSON.stringify({ type: "success", message: "Address deleted" }));
        }
        return res.redirect("/profile?section=address");
    } catch (err) {
        console.error("Address delete error", err);
        return res.redirect("/profile?section=address");
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", { httpOnly: true });
    return res.redirect("/home");
};
