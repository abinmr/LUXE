import mongoose from "mongoose";

const couponModel = mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        description: String,
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        minPurchaseAmount: {
            type: Number,
            default: 0,
        },
        maxDiscountAmount: Number,
        usageLimit: Number,
        users: [mongoose.Schema.Types.ObjectId],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponModel);
export default Coupon;
