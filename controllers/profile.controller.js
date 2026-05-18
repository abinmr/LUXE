import bcrypt from "bcrypt";
import fs from "fs";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import cloudinary from "../lib/cloudinary.js";
import { sendOtpVerification } from "./userAuth.controller.js";
import Otp from "../models/otp.model.js";
import Order from "../models/order.model.js";
import { createAddress, findAddresses, generateInvoice } from "../service/profile.service.js";
import { updateProduct } from "../service/product.service.js";
import { notFound, serverError, success } from "../service/status.service.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransation.model.js";

export const getProfile = async (req, res) => {
    try {
        const currentSection = req.query.section || "profile";
        const toast = req.flash("toast")[0];
        const phoneError = req.flash("addressError")[0];
        let addresses = [];
        let orders = [];
        if (currentSection === "address") {
            addresses = await findAddresses(req.user?._id);
        }
        if (currentSection === "order-history") {
            orders = await Order.find({ userId: req.user?._id }).sort({ createdAt: -1 });
        }
        let wallet = "00:00";
        if (currentSection === "wallet") {
            const walletData = await Wallet.findOne({ userId: req.user?._id });
            if (walletData) {
                wallet = walletData;
            }
        }
        let totalReferrals = 0;
        let totalReferralEarning = 0;
        if (currentSection === "referrals") {
            let referrals = await WalletTransaction.find({ referenceModel: "User" });
            totalReferrals = referrals.length;
            totalReferralEarning = referrals.reduce((acc, curr) => acc + curr.amount, 0);
        }

        let walletHistory = [];
        if (currentSection === "wallet") {
            walletHistory = await WalletTransaction.find({ userId: req.user?._id }).populate("referenceId").sort({ createdAt: -1 });
        }
        res.render("profile", {
            section: currentSection,
            addresses: addresses,
            toast: toast ? JSON.parse(toast) : null,
            phoneError: phoneError,
            user: req.user,
            orders: orders,
            wallet,
            walletHistory,
            totalReferrals,
            totalReferralEarning,
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

        if (fullName === "" || phone === "" || pincode === "" || house === "" || city === "" || state === "") {
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

        await createAddress(req.body, req.user?._id);

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

export const getOrderDetails = async (req, res) => {
    const id = req.params.id;
    const orderDetails = await Order.findOne({ orderId: id });
    return res.render("orderDetails", { orderDetails });
};

export const getOrderInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.redirect("/home");
        }
        generateInvoice(order, res);
    } catch (err) {
        console.error(err);
    }
};

// FIX: refund money when cancel order if not COD
export const cancelOrder = async (req, res) => {
    try {
        const id = req.params.id;
        const { reason, itemId } = req.body;
        console.log(req.body);
        const order = await Order.findById(id);

        let refundAmount = 0;
        let itemsCancelled = 0;

        if (itemId) {
            const item = order.items.id(itemId);
            if (!item) return res.status(404).json({ success: false, message: "Item not found" });
            if (item.orderStatus === "cancelled") return res.status(400).json({ success: false, message: "Item already cancelled" });

            item.orderStatus = "cancelled";
            item.cancellationReason = reason;
            await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
            refundAmount = item.price * item.quantity;
            itemsCancelled++;
        } else {
            for (const item of order.items) {
                if (item.orderStatus !== "cancelled") {
                    item.orderStatus = "cancelled";
                    item.cancellationReason = reason;
                    await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
                    refundAmount += item.price * item.quantity;
                    itemsCancelled++;
                }
            }
            if (itemsCancelled === order.items.length) {
                refundAmount = order.total;
            }
        }

        if (itemsCancelled === 0) {
            return res.status(400).json({ success: false, message: "No items to cancel" });
        }

        if (order.paymentMethod !== "cod" && refundAmount > 0) {
            let wallet = await Wallet.findOne({ userId: req.user?._id });
            if (!wallet) {
                wallet = await Wallet.create({ userId: req.user?._id, balance: 0 });
            }
            wallet.balance = Math.round((wallet.balance + refundAmount) * 100) / 100;
            await wallet.save();
            await WalletTransaction.create({
                walletId: wallet._id,
                userId: req.user?._id,
                orderId: order.orderId,
                transactionType: "credit",
                amount: refundAmount,
                description: "Money refunded for cancelled order",
                status: "completed",
            });
        }

        await order.save();
        const allCancelled = order.items.every((item) => item.orderStatus === "cancelled");
        return res.status(success).json({ success: true, message: "Order cancelled", allCancelled });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Failed to cancel order" });
    }
};

export const returnOrder = async (req, res) => {
    try {
        const id = req.params.id;
        const reason = req.body.reason;
        const itemId = req.body.itemId;
        const order = await Order.findById(id);

        let itemsReturned = 0;

        if (itemId) {
            const item = order.items.id(itemId);
            if (!item) return res.status(notFound).json({ success: false, message: "Item not found" });
            if (["return-requested", "returned", "cancelled"].includes(item.orderStatus)) {
                return res.status(400).json({ success: false, message: "Item cannot be returned" });
            }
            item.orderStatus = "return-requested";
            item.returnReason = reason;
            itemsReturned++;
        } else {
            for (const item of order.items) {
                if (!["return-requested", "returned", "cancelled"].includes(item.orderStatus)) {
                    item.orderStatus = "return-requested";
                    item.returnReason = reason;
                    itemsReturned++;
                }
            }
        }

        if (itemsReturned === 0) {
            return res.status(400).json({ success: false, message: "No items to return" });
        }

        await order.save();
        const allReturnRequested = order.items.every((item) => item.orderStatus === "return-requested");
        return res.status(success).json({ success: true, message: "Return requested", allReturnRequested });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Failed to request return" });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", { httpOnly: true });
    return res.redirect("/home");
};
