import Product from "../models/product.model.js";

/**
 * @param {string} productId
 * @param {string} variantId
 * @param {string} sizeId
 * @param {number} quantity
 */
export const updateProduct = async (productId, variantId, sizeId, quantity) => {
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
            arrayFilters: [{ "v._id": variantId }, { "s._id": sizeId }],
        },
    );
};
