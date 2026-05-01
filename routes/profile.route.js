import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addAddress, changePassword, deleteAddress, editAddress, getEmailOtpPage, getProfile, logout, updateProfile, verifyEmailOtp } from "../controllers/profile.controller.js";
import upload from "../lib/multer.js";
import Order from "../models/order.model.js";
import { generateInvoice } from "../service/profile.service.js";
import Product from "../models/product.model.js";
import { updateProduct } from "../service/product.service.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/", getProfile);

router.post("/update-profile", upload.single("profile"), updateProfile);

router.get("/verify-email-otp", getEmailOtpPage);

router.post("/verify-email-otp", verifyEmailOtp);

router.post("/change-password", changePassword);

router.post("/add-address", addAddress);

router.post("/address/edit/:id", editAddress);

router.get("/address/delete/:id", deleteAddress);

router.get("/orders/:id", async (req, res) => {
    const id = req.params.id;
    const orderDetails = await Order.findOne({ orderId: id });
    return res.render("orderDetails", { orderDetails });
});

router.get("/orders/:id/invoice", async (req, res) => {
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
});

router.post("/orders/:id/cancel", async (req, res) => {
    try {
        const id = req.params.id;
        const reason = req.body.reason;
        const itemId = req.body.itemId;
        const order = await Order.findById(id);

        if (itemId) {
            // Cancel a specific item
            const item = order.items.id(itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: "Item not found" });
            }
            item.orderStatus = "cancelled";
            item.cancellationReason = reason;
            await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
        } else {
            // Cancel all items (fallback)
            for (const item of order.items) {
                item.orderStatus = "cancelled";
                item.cancellationReason = reason;
                await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
            }
        }

        await order.save();
        const allCancelled = order.items.every((item) => item.orderStatus === "cancelled");
        return res.status(200).json({ success: true, message: "Order cancelled", allCancelled });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
});

router.post("/orders/:id/return", async (req, res) => {
    try {
        const id = req.params.id;
        const reason = req.body.reason;
        const itemId = req.body.itemId;
        const order = await Order.findById(id);

        if (itemId) {
            const item = order.items.id(itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: "Item not found" });
            }
            item.orderStatus = "return-requested";
            item.returnReason = reason;
        } else {
            for (const item of order.items) {
                item.orderStatus = "return-requested";
                item.returnReason = reason;
            }
        }

        await order.save();
        const allReturnRequested = order.items.every((item) => item.orderStatus === "return-requested");
        return res.status(200).json({ success: true, message: "Return requested", allReturnRequested });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to request return" });
    }
});

router.get("/logout", logout);

export default router;
