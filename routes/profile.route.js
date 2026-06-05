import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addAddress, cancelOrder, changePassword, deleteAddress, editAddress, getEmailOtpPage, getOrderDetails, getOrderInvoice, getProfile, logout, returnOrder, updateProfile, verifyEmailOtp } from "../controllers/profile.controller.js";
import upload from "../lib/multer.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/", getProfile);

router.post("/update-profile", upload.single("profile"), updateProfile);

router.get("/verify-email-otp", getEmailOtpPage);

router.post("/verify-email-otp", verifyEmailOtp);

router.post("/change-password", changePassword);

router.post("/add-address", addAddress);

router.put("/address/edit/:id", editAddress);

router.delete("/address/delete/:id", deleteAddress);

router.get("/orders/:id", getOrderDetails);

router.get("/orders/:id/invoice", getOrderInvoice);

router.patch("/orders/:id/cancel", cancelOrder);

router.patch("/orders/:id/return", returnOrder);

router.get("/logout", logout);

export default router;
