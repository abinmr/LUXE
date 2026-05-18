import mongoose from "mongoose";

const walletTransaction = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        referenceModel: {
            type: String,
            enum: ["Order", "User"],
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "referenceModel"
        },
        transactionType: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        amount: {
            type: Number,
            min: 0,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
        },
    },
    { timestamps: true },
);

const WalletTransaction = mongoose.model("WalletTransaction", walletTransaction);

export default WalletTransaction;
