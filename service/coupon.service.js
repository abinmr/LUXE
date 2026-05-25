import Coupon from "../models/coupon.model";

/**
 * @param {string} code -
 */
export async function getCouponsDetails(code) {
    return await Coupon.findOne({ code: code });
}
