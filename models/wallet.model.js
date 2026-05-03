import mongoose from "mongoose";

const walletModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        balance: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        transationHistory: {
            type: [mongoose.Schema.Types.ObjectId],
        },
    },
    { timestamps: true },
);

const Wallet = mongoose.model("Wallet", walletModel);

export default Wallet;
