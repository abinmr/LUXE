import Product from "../models/product.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */

export async function getTotalDocuments(query) {
    return await Product.countDocuments(query);
}

export async function getPaginatedProducts(dbQuery, skip, limit) {
    return await Product.find(dbQuery).populate("category").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

export async function getProductWithCateogory(id) {
    return await Product.findById(id).populate("category").lean();
}

export async function getAllProducts() {
    return await Product.find({ isListed: true, isDeleted: false });
}

/**
 * @param {ObjectId} id -
 * @param {Object} projection -
 */
export async function getProductById(id, projection = null) {
    return Product.findById(id, projection);
}

export async function createProduct(data) {
    return await Product.create(data);
}

export async function updateProductById(id, query) {
    return await Product.findByIdAndUpdate(id, query);
}

/**
 * @param {string} productId
 * @param {string} variantId
 * @param {string} sizeId
 * @param {number} quantity
 */
export async function updateProduct(productId, variantId, sizeId, quantity) {
    const sizeFilter = { "s._id": sizeId };
    if (quantity < 0) {
        sizeFilter["s.stock"] = { $gte: Math.abs(quantity) };
    }
    return await Product.updateOne(
        {
            _id: productId,
            "variants._id": variantId,
            "variants.sizes._id": sizeId,
        },
        {
            $inc: { "variants.$[v].sizes.$[s].stock": quantity },
        },
        {
            arrayFilters: [{ "v._id": variantId }, sizeFilter],
        },
    );
}
