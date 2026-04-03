import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { getRegisterOtp, getResetOtp, login, otpVerification, register, resendOtp, resetOtp, resetPasswordOtp, setCookies, updatePassword } from "../controllers/userAuth.controller.js";
import { redirectIfAuth } from "../middlewares/user.auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/register", redirectIfAuth, (req, res) => {
    return res.render("register");
});

router.get("/register/otp", getRegisterOtp);

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

router.get("/login/reset-otp", getResetOtp);

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

router.post("/login/reset-otp", resetOtp);

router.post("/login/update-password", updatePassword);

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
