import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addAddress, changePassword, deleteAddress, editAddress, getEmailOtpPage, getProfile, logout, updateProfile, verifyEmailOtp } from "../controllers/profile.controller.js";
import upload from "../lib/multer.js";

const router = express.Router();

router.get("/", protectedRoute, getProfile);

router.post("/update-profile", protectedRoute, upload.single("profile"), updateProfile);

router.get("/verify-email-otp", protectedRoute, getEmailOtpPage);

router.post("/verify-email-otp", protectedRoute, verifyEmailOtp);

router.post("/change-password", protectedRoute, changePassword);

router.post("/add-address", protectedRoute, addAddress);

router.post("/address/edit/:id", protectedRoute, editAddress);

router.get("/address/delete/:id", protectedRoute, deleteAddress);

router.get("/logout", logout);

export default router;
