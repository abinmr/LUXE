import mongoose from "mongoose";

const productModel = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        isListed: {
            type: Boolean,
            required: true,
        },

        isFeatured: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true },
);

const Product = mongoose.model("Product", productModel);

export default Product;
