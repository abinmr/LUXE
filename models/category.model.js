import mongoose from "mongoose";

const categoryModel = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        slug: {
            type: String,
            unique: true,
            required: true,
        },

        image: {
            type: String,
        },

        isActive: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true },
);

const Category = mongoose.model("Category", categoryModel);

export default Category;
