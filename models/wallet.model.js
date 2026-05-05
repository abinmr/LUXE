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
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

walletModel.virtual("transactions", {
    ref: "WalletTransaction",
    localField: "_id",
    foreignField: "walletId",
});

const Wallet = mongoose.model("Wallet", walletModel);

export default Wallet;
