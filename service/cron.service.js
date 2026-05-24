import cron from "node-cron";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";

export const initCronJob = () => {
    cron.schedule("*/15 * * * *", async () => {
        try {
            const expiryTime = new Date(Date.now() - 30 * 60 * 1000);
            const expiredOrder = await Order.find({
                paymentMethod: "online",
                paymentStatus: { $in: ["pending", "failed"] },
                createdAt: { $lt: expiryTime },
                "items.orderStatus": { $ne: "cancelled" },
            });

            if (expiredOrder.length === 0) {
                console.log("No expired or unpaid order remains");
                return;
            }

            for (const order of expiredOrder) {
                order.items.forEach((item) => {
                    if (item.orderStatus !== "cancelled") {
                        item.orderStatus = "cancelled";
                        item.cancellationReason = "Online payment window expired. (Auto cancelled by cron)";
                    }
                });
                order.paymentStatus = "failed";
                await order.save();
                if (order.couponCode) {
                    await Coupon.updateOne({ code: order.couponCode }, { $pull: { users: order.userId } });
                }
            }
        } catch (err) {
            console.error(err);
        }
    });
};
