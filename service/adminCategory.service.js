import Category from "../models/category.model.js";

export async function getAllCategories() {
    return await Category.find({ isActive: true, isDeleted: false });
}

/**
 *@param {string} id
 *@param {Object} query
 */
export async function updateCategory(id, query) {
    return await Category.findByIdAndUpdate(id, query);
}
