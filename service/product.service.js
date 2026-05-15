import Product from "../models/product.model.js";

export async function getAllProducts() {
    return await Product.find({ isListed: true, isDeleted: true });
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
