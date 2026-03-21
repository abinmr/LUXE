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
            ref: "Category",
            required: true,
        },

        isListed: {
            type: Boolean,
            required: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
            required: true,
        },
    },
    { timestamps: true },
);

const Product = mongoose.model("Product", productModel);

export default Product;
