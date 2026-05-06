import { customAlphabet } from "nanoid";
import Order from "../models/order.model.js";

/**
 *@param {import('express').Request} req
 */
export const createOrder = async (req, checkout, address, paymentMethod) => {
    const nanoid = customAlphabet("1234567890", 10);
    const orderId = `ORD-${nanoid()}`;

    const itemPaymentStatus = "pending";
    const estimatedDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const items = checkout.items.map((item) => ({
        ...item,
        paymentStatus: itemPaymentStatus,
        orderStatus: "pending",
    }));

    return await Order.create({
        userId: req.user?._id,
        orderId: orderId,
        username: req.user?.fullname,
        items,
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        GST: checkout.gst,
        shipping: checkout.shipping,
        total: checkout.total,
        shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            pincode: address.pincode,
            houseNumber: address.houseNumber,
            street: address?.street,
            city: address.city,
            state: address.state,
        },
        paymentMethod: paymentMethod,
        couponCode: checkout.appliedCoupon,
        estimatedDeliveryDate,
    });
};
