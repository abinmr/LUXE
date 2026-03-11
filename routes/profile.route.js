import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addAddress, changePassword, deleteAddress, editAddress, getProfile, logout, updateProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/", protectedRoute, getProfile);

router.post("/update-profile", protectedRoute, updateProfile);

router.post("/change-password", protectedRoute, changePassword);

router.post("/add-address", protectedRoute, addAddress);

router.post("/address/edit/:id", protectedRoute, editAddress);

router.get("/address/delete/:id", protectedRoute, deleteAddress);

router.get("/logout", logout);

export default router;
