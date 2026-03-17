import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import GoogleStrategy from "passport-google-oauth2";
import { login, otpVerification, register, resendOtp, resetPasswordOtp, setCookies } from "../controllers/userAuth.controller.js";
import { redirectIfAuth } from "../middlewares/user.auth.middleware.js";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";

const router = express.Router();

router.get("/register", redirectIfAuth, (req, res) => {
    return res.render("register");
});

router.get("/register/otp", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/auth/register");

    const otpRecord = await Otp.findOne({ userId: userId });

    let secondsLeft = 0;
    if (otpRecord) {
        secondsLeft = Math.floor((otpRecord.expiresAt - Date.now()) / 1000);
        secondsLeft = Math.max(0, secondsLeft);
    }
    return res.render("otp", { secondsLeft, error: req.flash("otpError")[0] });
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/auth/login",
        failureFlash: true,
    }),
    async (req, res) => {
        try {
            const userId = req.user._id;

            await setCookies(userId, res);
            req.session.userId = userId;
            return res.redirect("/home");
        } catch (err) {
            console.error("Cookie setting failed", err);
            req.flash("loginError", "Authentication Failed");
            return res.redirect("/auth/login");
        }
    },
);

router.get("/login", redirectIfAuth, (req, res) => {
    const passportError = req.flash("error")[0];
    const loginError = req.flash("loginError")[0];
    const error = passportError || loginError;
    return res.render("login", { error: error });
});

router.get("/login/reset-otp", async (req, res) => {
    const userId = req.session.resetUserId;
    if (!userId) return res.redirect("/auth/login/reset-password");

    const otpRecord = await Otp.findOne({ userId: userId });
    let secondsLeft = 0;
    if (otpRecord) {
        const resendAt = new Date(otpRecord.createdAt).getTime() + 60 * 1000;
        secondsLeft = Math.max(0, Math.floor((resendAt - Date.now()) / 1000));
    }

    return res.render("reset", { secondsLeft, error: req.flash("resetOtpError")[0] });
});

router.get("/login/reset-password", (req, res) => {
    const resetError = req.flash("resetError")[0];
    return res.render("resetPassword", { error: resetError });
});

router.get("/login/reset-otp", (req, res) => {
    const resetOtpError = req.flash("resetOtpError")[0];
    return res.render("reset", { error: resetOtpError });
});

router.get("/login/update-password", (req, res) => {
    const error = req.flash("newPasswordError")[0];
    return res.render("newPassword", { error: error });
});

router.post("/login/reset-password", resetPasswordOtp);

router.post("/login/reset-otp", async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.session.resetUserId;

        if (!userId) return res.redirect("/auth/login/reset-password");

        const otpDetails = await Otp.findOne({ userId: userId });
        if (!otpDetails) {
            req.flash("resetOtpError", "OTP not found. Try again");
            return res.redirect("/auth/login/reset-otp");
        }

        if (otpDetails.expiresAt < new Date()) {
            req.flash("resetOtpError", "OTP expired. Request a new one");
            return res.redirect("/auth/login/reset-otp");
        }

        const isMatch = await bcrypt.compare(otp, otpDetails.otp);
        if (!isMatch) {
            req.flash("resetOtpError", "Invalid OTP");
            return res.redirect("/auth/login/reset-otp");
        }

        await Otp.deleteOne({ _id: otpDetails._id });

        req.session.resetVerified = true;

        return res.redirect("/auth/login/update-password");
    } catch (err) {
        console.error(err);
        req.flash("resetOtpError", "something went wrong");
        return res.redirect("/auth/login/reset-otp");
    }
});

router.post("/login/update-password", async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const userId = req.session.resetUserId;
        console.log(newPassword, confirmPassword);
        const numberCount = (newPassword.match(/[0-9]/g) || []).length;

        if (newPassword.length < 8) {
            req.flash("newPasswordError", "password must be at least 8 characters");
            return res.redirect("/auth/login/update-password");
        }

        if (numberCount < 2) {
            req.flash("newPasswordError", "Password must contain at least 2 numbers");
            return res.redirect("/auth/login/update-password");
        }

        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
            req.flash("newPasswordError", "password must contain 1 special character.");
            return res.redirect("/auth/login/update-password");
        }

        if (newPassword !== confirmPassword) {
            req.flash("newPasswordError", "password do not match");
            return res.redirect("/auth/login/update-password");
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashed });

        delete req.session.resetUserId;
        delete req.session.resetVerified;
        return res.redirect("/auth/login");
    } catch (err) {
        console.error(err);
        req.flash("newPasswordError", "Something went wrong");
        return res.redirect("/auth/login/update-password");
    }
});

router.post("/register", register);

router.post("/register/otp", otpVerification);

router.post("/register/otp/resend", resendOtp);

router.post("/login", login);

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, cb) => {
            try {
                const user = await User.findOne({ email: profile.email });
                if (!user) {
                    console.log("Profile: ", profile);
                    const newUser = await User.create({ fullname: profile.given_name, email: profile.email, googleId: profile.id, authMethod: "google", isVerified: true });
                    return cb(null, newUser);
                } else {
                    if (user.isBlocked) {
                        return cb(null, false, { message: "You are blocked from accessing this site" });
                    }
                    if (user.authMethod !== "google") {
                        return cb(null, false, { message: "Email already exist. Please login using email and password" });
                    }
                    return cb(null, user);
                }
            } catch (err) {
                return cb(err, null);
            }
        },
    ),
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

export default router;
