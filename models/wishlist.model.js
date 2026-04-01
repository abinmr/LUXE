import mongoose from "mongoose";

const wishlistModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
            unique: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                    unique: true,
                },
            },
        ],
    },
    { timestamps: true },
);

const Wishlist = mongoose.model("Wishlist", wishlistModel);

export default Wishlist;
