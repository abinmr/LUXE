import mongoose from "mongoose";

const variantModel = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        size: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        compareAtPrice: {
            type: Number,
            required: true,
        },

        stockQuantity: {
            type: Number,
            required: true,
        },

        color: {
            type: String,
        },

        image: {
            type: String,
        },
    },

    { timestamps: true },
);

const Variant = mongoose.model("Varient", variantModel);

export default Variant;
