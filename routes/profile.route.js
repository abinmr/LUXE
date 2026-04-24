import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addAddress, changePassword, deleteAddress, editAddress, getEmailOtpPage, getProfile, logout, updateProfile, verifyEmailOtp } from "../controllers/profile.controller.js";
import upload from "../lib/multer.js";
import Order from "../models/order.model.js";
import { generateInvoice } from "../service/profile.service.js";

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

router.get("/logout", logout);

export default router;
