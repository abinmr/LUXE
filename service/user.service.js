import User from "../models/user.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */

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
