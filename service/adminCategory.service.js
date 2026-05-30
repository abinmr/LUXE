import Category from "../models/category.model.js";

export async function getTotalCategories() {
    return await Category.countDocuments();
}

export async function getAllCategories() {
    return await Category.find({ isDeleted: false });
}

export async function getAllActiveCategories() {
    return await Category.find({ isActive: true, isDeleted: false });
}

export async function getCategoryById(id) {
    return await Category.findById(id);
}

export async function getOneCategory(query) {
    return await Category.findOne(query);
}

/**
 * @param {Object} query
 * @param {number} skip -
 * @param {number} limit -
 */
export async function getPaginatedCategory(query, skip, limit) {
    return await Category.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
}

export async function createCategory(query) {
    return await Category.create(query);
}

/**
 *@param {string} id
 *@param {Object} query
 */
export async function updateCategory(id, query) {
    return await Category.findByIdAndUpdate(id, query);
}
