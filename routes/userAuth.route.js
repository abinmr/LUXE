import express from "express";
import { login, otpVerification, register } from "../controllers/userAuth.controller.js";
import { redirectIfAuth, noCache } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

router.get("/register", redirectIfAuth, (req, res) => {
    return res.render("register");
});

router.get("/register/otp", (req, res) => {
    return res.render("otp");
});

router.get("/login", redirectIfAuth, (req, res) => {
    return res.render("login", { error: req.query.error });
});

router.post("/register", register);

router.post("/register/otp", otpVerification);

router.post("/login", login);

export default router;
