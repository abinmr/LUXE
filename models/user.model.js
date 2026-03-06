import mongoose from "mongoose";

const userModel = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: Number,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        defaultShippingAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
        },
        referralCode: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const User = mongoose.model("User", userModel);

export default User;
