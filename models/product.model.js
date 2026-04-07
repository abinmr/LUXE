import mongoose from "mongoose";

const productModel = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
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

        variants: [
            {
                color: { type: String, trim: true, unique: true },
                images: [{ type: String }],
                sizes: [
                    {
                        size: { type: String, uppercase: true, trim: true, required: true },
                        price: { type: Number, required: true },
                        compareAtPrice: { type: Number },
                        stock: { type: Number, required: true },
                    },
                ],
            },
        ],

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
