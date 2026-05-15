import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";

/**
 * @typedef {import("mongoose").Types.ObjectId} ObjectId
 */
/**
 * @param {ObjectId} userId
 * @returns {Promise<object>}
 */

export async function getWishlistProducts(userId) {
    if (!userId) return [];
    const wishlist = await Wishlist.findOne({ userId });
    return wishlist ? wishlist.products.map((item) => item.productId.toString()) : [];
}

export async function getPaginatedProducts(page = 1, limit = 8) {
    const skip = (page - 1) * limit;
    return await Product.aggregate([
        {
            $match: {
                isListed: true,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "categoryData",
            },
        },
        { $unwind: "$categoryData" },
        {
            $match: {
                "categoryData.isActive": true,
                "categoryData.isDeleted": false,
            },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
    ]);
}

/**
 * @param {ObjectId} id
 */
export async function getProductById(id) {
    return Product.findOne({ _id: id, isListed: true, isDeleted: false }).populate("category");
}

/**
 * @param {ObjectId} excludeId
 * @param {number} limit
 */
export async function getRelatedProducts(excludeId, limit = 4) {
    return Product.find({ _id: { $ne: excludeId } }).limit(limit);
}

/**
 * @param {string} search
 */
export async function getSearchProductsByName(search) {
    const regex = { $regex: search, $options: "i" };
    const [products, colors] = await Promise.all([
        Product.find({ name: regex, isListed: true, isDeleted: false }),
        Product.find({ name: regex, isListed: true, isDeleted: false }).distinct("variants.color"),
    ]);
    return { products, colors };
}

/**
 * @param {Object} options
 * @param {string} options.search
 * @param {number} options.priceRange
 * @param {string[]} options.sizes
 * @param {string[]} options.colors
 * @param {string} options.sort
 */
export async function getFilterAndSortProducts({ search, priceRange, sizes, colors, sort }) {
    const query = {
        name: { $regex: search || "", $options: "i" },
        isListed: true,
        isDeleted: false,
    };

    if (sizes.length > 0) {
        query["variants.sizes.size"] = { $in: sizes };
    }

    if (colors.length > 0) {
        query["variants.color"] = { $in: colors.map((c) => new RegExp(`^${c}$`, "i")) };
    }

    if (priceRange) {
        query["variants.sizes.price"] = { $lte: parseInt(priceRange) };
    }

    const sortMap = {
        "low-to-high": { "variants.0.sizes.0.price": -1 },
        "high-to-low": { "variants.0.sizes.0.price": 1 },
        "A-Z": { name: 1 },
        "Z-A": { name: -1 },
    };

    return Product.find(query).sort(sortMap[sort] ?? { createdAt: 1 });
}
