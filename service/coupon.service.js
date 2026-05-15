import Coupon from "../models/coupon.model";

export async function getCoupons() {
    const result = await Coupon.find().limit(3);
}
