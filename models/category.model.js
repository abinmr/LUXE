import mongoose from "mongoose";
import slugify from "slugify";

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

        isDeleted: {
            type: Boolean,
            default: false,
            required: true,
        },
    },
    { timestamps: true },
);

categoryModel.pre("validate", function () {
    if (this.name && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
        });
    }
});

const Category = mongoose.model("Category", categoryModel);

export default Category;
