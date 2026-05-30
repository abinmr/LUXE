import Order from "../models/order.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */
/** @typedef {InstanceType<typeof import('../models/order.model.js').default>} OrderDocument */
/** @typedef {import('mongoose').UpdateQuery<OrderDocument>} OrderUpdate */

export async function getTotalOrders(query) {
    return await Order.countDocuments(query);
}

/**
 * @param {Object} id -
 */
export async function getOrderById(id) {
    return await Order.findById(id);
}

/**
 * @param {Object} query -
 * @param {number} skip -
 * @param {number} limit -
 */
export async function getPaginatedOrder(query, skip, limit) {
    return await Order.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
}

export async function getOrderWithUser(id) {
    return await Order.findById(id).populate("userId");
}

/**
 * @param {ObjectId} userId
 */
export async function getUserOrders(userId) {
    return await Order.find({ userId: userId }).sort({ createdAt: -1 });
}

export async function getOneOrder(data) {
    return await Order.findOne(data);
}

/**
 * @param {ObjectId} id -
 * @param {OrderUpdate} updateData -
 */
export async function updateOrder(id, updateData) {
    return await Order.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
}

export async function getBestSellingProducts() {
    const bestSellingProducts = await Order.aggregate([
        { $unwind: "$items" },
        {
            $match: {
                "items.orderStatus": { $nin: ["cancelled", "returned"] },
            },
        },
        {
            $group: {
                _id: "$items.productId",
                productName: { $first: "$items.productName" },
                productImage: { $first: "$items.productImage" },
                totalSold: { $sum: "$items.quantity" },
            },
        },
        {
            $sort: { totalSold: -1 },
        },
        { $limit: 10 },
    ]);
    return bestSellingProducts;
}

export async function getBestSellingCategories() {
    const bestSellingCategories = await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.orderStatus": { $nin: ["cancelled", "returned"] } } },

        {
            $group: {
                _id: "$items.categoryId",
                totalSold: { $sum: "$items.quantity" },
            },
        },

        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryInfo",
            },
        },
        { $unwind: "$categoryInfo" },

        {
            $project: {
                _id: 0,
                categoryId: "$_id",
                categoryName: "$categoryInfo.name",
                categoryImage: "$categoryInfo.image",
                totalSold: 1,
            },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
    ]);
    return bestSellingCategories;
}

export async function getTotalRevenue() {
    const totalRevenueResult = await Order.aggregate([
        { $unwind: "$items" },
        {
            $match: {
                "items.orderStatus": { $nin: ["cancelled", "returned"] },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
        },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
    return totalRevenue;
}

export async function monthelyRevenue() {
    const currentYear = new Date().getFullYear();
    const monthlyData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(currentYear, 0, 1),
                    $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
                },
            },
        },
        { $unwind: "$items" },
        {
            $match: {
                "items.orderStatus": { $nin: ["cancelled", "returned"] },
            },
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
        },
    ]);
    const revenueArray = new Array(12).fill(0);
    monthlyData.forEach((data) => {
        revenueArray[data._id - 1] = data.totalRevenue;
    });
    return JSON.stringify(revenueArray);
}

export async function monthelyOrders() {
    const currentYear = new Date().getFullYear();
    const monthelyData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(currentYear, 0, 1),
                    $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalOrders: { $sum: 1 },
            },
        },
    ]);
    const revenueArray = new Array(12).fill(0);
    monthelyData.forEach((data) => {
        revenueArray[data._id - 1] = data.totalOrders;
    });
    return JSON.stringify(revenueArray);
}
