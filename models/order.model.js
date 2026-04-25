import mongoose from "mongoose";

const orderModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
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
                productName: {
                    type: String,
                    required: true,
                },
                productImage: {
                    type: String,
                    required: true,
                },
                color: {
                    type: String,
                    required: true,
                },
                size: {
                    type: String,
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
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
            min: 1,
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
            min: 1,
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "coupon",
        },
        couponCode: String,
        shippingAddress: {
            fullName: {
                type: String,
                required: true,
            },
            phone: {
                type: Number,
                required: true,
            },
            pincode: {
                type: Number,
                required: true,
            },
            houseNumber: {
                type: String,
                required: true,
            },
            street: String,
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
        },
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
            enum: ["pending", "processing", "shipped", "delivered", "cancelled", "return-requested", "returned"],
            default: "pending",
            required: true,
        },
        estimatedDeliveryDate: Date,
        cancellationReason: String,
        returnReason: String,
        adminNote: String,
    },
    { timestamps: true },
);

const Order = mongoose.model("Order", orderModel);
export default Order;
