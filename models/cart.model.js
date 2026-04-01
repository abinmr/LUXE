import mongoose from "mongoose";

const cartModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            unique: true,
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
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
                isSelected: {
                    type: Boolean,
                    default: true,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true },
);

const Cart = mongoose.model("Cart", cartModel);

export default Cart;
