import User from "../models/user.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */

export async function getTotalUsers(query = null) {
    if (query) {
        return User.countDocuments(query);
    }
    return User.countDocuments();
}

export async function getPaginatedUsers(query, skip, limit) {
    return await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
}

/**
 * @param {ObjectId} id -
 */
export async function findUserById(id) {
    return await User.findById(id).select("-password");
}

export async function findOneUser(query) {
    return await User.findOne(query);
}

/**
 * @param {Object} data
 */
export async function createUser(data) {
    return await User.create(data);
}

export async function userFindAndUpdate(id, data) {
    return await User.findByIdAndUpdate(id, data);
}
