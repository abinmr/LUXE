import mongoose from "mongoose";

const orderModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                sizeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    max: 10,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        GST: {
            type: Number,
            required: true,
        },
        shipping: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "coupon",
        },
        couponCode: String,
        shippingAddress: {},
        paymentMethod: {
            type: String,
            enum: ["cod", "card", "upi", "wallet"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
            required: true,
        },
        orderStatus: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending",
            required: true,
        },
        cancellationReason: String,
        note: String,
    },
    { timestamps: true },
);

const Order = mongoose.model("Order", orderModel);
export default Order;
