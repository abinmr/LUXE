import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { login, otpVerification, register, setCookies } from "../controllers/userAuth.controller.js";
import { redirectIfAuth } from "../middlewares/user.auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/register", redirectIfAuth, (req, res) => {
    return res.render("register");
});

router.get("/register/otp", (req, res) => {
    return res.render("otp");
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login?error=GoogleAuthFailed",
    }),
    async (req, res) => {
        try {
            const userId = req.user._id;

            await setCookies(userId, res);
            req.session.userid = userId;
            return res.redirect("/home");
        } catch (err) {
            console.error("Cookie setting failed", err);
            return res.redirect("/api/auth/login?error=AuthenticationFailed");
        }
    },
);

router.get("/login", redirectIfAuth, (req, res) => {
    return res.render("login", { error: req.query.error });
});

router.post("/register", register);

router.post("/register/otp", otpVerification);

router.post("/login", login);

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, cb) => {
            try {
                const user = await User.findOne({ email: profile.email });
                if (!user) {
                    const newUser = await User.create({ fullname: profile.given_name, email: profile.email, password: "google", isVerified: true });
                    return cb(null, newUser);
                } else {
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
