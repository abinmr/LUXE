import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import nodeMailer from "nodemailer";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.AUTH_GMAIL,
        pass: process.env.GMAIL_PASSWORD,
    },
});

export const setCookies = async (userId, res) => {
    const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
    });
};

export const sendOtpVerification = async (userId, email) => {
    try {
        const otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const mailOptions = {
            from: process.env.AUTH_GMAIL,
            to: email,
            subject: "Verify your account",
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                    <p>Your verification code is:</p>
                    
                    <h2 style="color: #000; letter-spacing: 3px; font-size: 32px; margin: 20px 0;">
                        ${otp}
                    </h2>
                    
                    <p>For your security, this code will expire in 5 minutes.</p>
                </div>
                `,
        };

        const hashedOtp = await bcrypt.hash(otp, 10);

        const newOtpVerification = await Otp.create({
            userId: userId,
            otp: hashedOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

        await newOtpVerification.save();
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error("OTP send error", err);
        throw err;
    }
};
export const resendOtp = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect("/auth/register");

        const user = await User.findById(userId);
        if (!user) return res.redirect("/auth/register");

        await Otp.deleteOne({ userId: userId });
        await sendOtpVerification(userId, user.email);
        return res.redirect("/auth/register/otp");
    } catch (err) {
        console.error(err);
        req.flash("otpError", "Failed to resent OTP. Try again");
        return res.redirect("/auth/register/otp");
    }
};

export const login = async (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (!email) {
        return res.render("login", { emailError: "Email is required to create an account" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.render("login", { emailError: "Please enter a valid email" });
    }

    if (!password) {
        return res.render("login", { passwordError: "Please provide a password for your account" });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.render("login", { error: "Please register first." });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.render("login", { error: "Wrong email or password." });
    }

    if (user.isBlocked) {
        return res.render("login", { error: "you are blocked from accessing this site." });
    }

    req.session.userId = user._id;
    setCookies(user._id, res);

    return res.redirect("/home");
};

export const register = async (req, res) => {
    let { fullName, email, password, confirmPassword, referralCode } = req.body;
    fullName = fullName.trim();
    email = email.trim();
    password = password.trim();
    confirmPassword = confirmPassword.trim();
    referralCode = referralCode.trim();

    if (!fullName) {
        return res.render("register", { nameError: "Full name is required." });
    }

    if (!email) {
        return res.render("register", { emailError: "Email is required to create an account" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.render("register", { emailError: "Please enter a valid email" });
    }

    if (!password) {
        return res.render("register", { passwordError: "Please provide a password for your account" });
    }

    if (password.length < 8) {
        return res.render("register", { passwordError: "Password must be atleast 8 characters." });
    }

    const numberCount = (password.match(/[0-9]/g) || []).length;

    if (numberCount < 2) {
        return res.render("register", { passwordError: "Password must contain atleast 2 numbers." });
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        return res.render("register", { passwordError: "Password must contain atleast 1 special character." });
    }

    if (!confirmPassword) {
        return res.render("register", { confirmError: "please re-type your password" });
    }

    if (password !== confirmPassword) {
        return res.render("register", { confirmError: "Password do not match." });
    }

    const userExist = await User.findOne({ email: email });

    if (userExist) {
        return res.render("register", { error: "User alredy exist. Please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
        user = await User.create({
            fullname: fullName,
            email: email,
            password: hashedPassword,
        });

        await user.save();
        req.session.userId = user._id;
        console.log(user._id);
    } catch (err) {
        console.error(err);
    }

    await sendOtpVerification(user._id, email);

    return res.redirect("/auth/register/otp");
};

export const otpVerification = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log("OTP:", otp);
        const userId = req.session.userId;

        if (!otp) {
            req.flash("otpError", "OTP is required");
            return res.redirect("/auth/register/otp");
        }

        const otpDetails = await Otp.findOne({ userId: userId });

        if (!otpDetails) {
            req.flash("otpError", "OTP not found");
            return res.redirect("/auth/register/otp");
        }

        if (otpDetails.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpDetails._id });
            req.flash("otpError", "OTP expired. Please request a new one");
            return res.redirect("/auth/register/otp");
        }

        const isMatch = await bcrypt.compare(otp, otpDetails.otp);

        if (!isMatch) {
            req.flash("otpError", "Invalid OTP");
            return res.redirect("/auth/register/otp");
        }

        await User.findOneAndUpdate({ _id: userId }, { isVerified: true });
        await Otp.deleteOne({ _id: otpDetails._id });
        setCookies(req.session.userId, res);

        return res.redirect("/home");
    } catch (err) {
        console.error(err);
        req.flash("otpError", "Something went wrong");
        return res.redirect("/auth/register/otp");
    }
};

export const resetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email });

        if (!user) {
            req.flash("resetError", "Email does not exist");
            return res.redirect("/auth/login/reset-password");
        }

        req.session.resetUserId = user._id;

        await Otp.deleteOne({ userId: user._id });
        await sendOtpVerification(user._id, email);

        return res.redirect("/auth/login/reset-otp");
    } catch (err) {
        console.error(err);
        req.flash("resetError", "Something went wrong. Try again");
        return res.redirect("/auth/login/reset-password");
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
    });
    return res.redirect("/auth/login");
};
