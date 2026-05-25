import Otp from "../models/otp.model";

/** @typedef {import("mongoose").ObjectId} ObjectId */

/**
 * @param {ObjectId} userId
 * @param {string} hashedOtp
 */
export async function createOtp(userId, hashedOtp) {
    return await Otp.create({
        userId: userId,
        otp: hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
    });
}

/**
 * @param {Object} query
 */
export async function findOneOtp(query) {
    return await Otp.findOne(query);
}

export async function deleteOtpById(id) {
    return await Otp.deleteOne({ _id: id });
}

/**
 * @param {ObjectId} userId
 */
export async function deleteOtp(userId) {
    return await Otp.deleteOne({ userId: userId });
}
