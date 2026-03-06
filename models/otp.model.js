import mongoose from "mongoose";

const otpModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
});

const Otp = mongoose.model("Otp", otpModel);

export default Otp;
