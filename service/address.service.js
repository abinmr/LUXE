import Address from "../models/address.model.js";

/**
 *@param {string} userId
 */
export async function findAddresses(userId) {
    if (!userId) {
        throw new Error("Invalid or missing userId");
    }
    return await Address.find({ user: userId }).sort({ createdAt: -1 });
}
