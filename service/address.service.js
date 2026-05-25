import Address from "../models/address.model.js";
import { Types } from "mongoose";

/** @typedef {import("mongoose").ObjectId} ObjectId */

/**
 * @param {ObjectId} id -
 */
export async function findAddressById(id) {
    if (!id || !Types.ObjectId.isValid(id)) {
        throw new Error("Invalid or missing user id.");
    }
    return await Address.findById(id);
}

/**
 *@param {ObjectId} userId
 */
export async function findAddresses(userId) {
    if (!userId) {
        throw new Error("Invalid or missing userId");
    }
    return await Address.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * @param {Address} details
 * @param {string} userId
 * @returns
 */
export async function createAddress(details, userId) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid or missing userId");
    }

    if (!details) {
        throw new Error("Address details are required");
    }
    return await Address.create({
        user: userId,
        fullName: details.fullName,
        phone: details.phone,
        pincode: details.pincode,
        houseNumber: details.house,
        street: details.street,
        city: details.city,
        state: details.state,
        isDefault: details.isDefault === "on" ? true : false,
    });
}
