import Wishlist from "../models/wishlist.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */

/**
 * @param {ObjectId} userId -
 * @param {ObjectId} productId -
 */
export async function createWishlist(userId, productId) {
    return await Wishlist.create({ userId: userId, products: [{ productId }] });
}

/**
 * @param {ObjectId} userId
 */
export async function getUserWishlist(userId) {
    return await Wishlist.findOne({ userId: userId });
}

/**
 * @param {ObjectId} userId
 */
export async function getWishlistDetails(userId) {
    return await Wishlist.findOne({ userId: userId }).populate({
        path: "products.productId",
        populate: {
            path: "category",
            model: "Category",
        },
    });
}
