import mongoose from "mongoose";

const variantModel = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        color: {
            type: String,
        },

        image: {
            type: String,
        },

        sizes: [
            {
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
                },
                stock: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },

    { timestamps: true },
);

const Variants = mongoose.model("Varient", variantModel);

export default Variants;
