import Category from "../models/category.model.js";

/**
 *@param {string} id
 *@param {Object} query
 */
export async function updateCategory(id, query) {
    return await Category.findByIdAndUpdate(id, query);
}

export async function getAllCategories() {
    return await Category.find({ isActive: true, isDeleted: false });
}
