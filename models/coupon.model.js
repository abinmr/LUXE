import mongoose from "mongoose";

const couponModel = new mongoose.Schema(
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
        discountValue: {
            type: Number,
            required: true,
            min: 1,
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
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponModel);
export default Coupon;
