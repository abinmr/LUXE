import mongoose from "mongoose";

const cartModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    items: [
        {
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
            },
            quantity: {
                type: Number,
            },
        },
    ],
});

const Cart = mongoose.model("Cart", cartModel);

export default Cart;
