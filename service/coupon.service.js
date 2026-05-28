import Coupon from "../models/coupon.model.js";

export async function getTotalCoupons(query = null) {
    if (query) {
        return Coupon.countDocuments(query);
    }
    return await Coupon.countDocuments();
}

export async function getCouponById(id) {
    return await Coupon.findById(id);
}

export async function getValidCoupons() {
    const currentDate = new Date(Date.now());
    return await Coupon.find({ startDate: { $lte: currentDate } }).limit(3);
}

/**
 * @param {string} code -
 */
export async function getCouponsDetails(code) {
    return await Coupon.findOne({ code: code });
}

export async function getPaginatedCoupon(query, skip, limit) {
    return await Coupon.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
}

export async function createCoupon(data) {
    return await Coupon.create(data);
}

export async function couponUpdateById(id, query) {
    return await Coupon.findByIdAndUpdate(id, query);
}
