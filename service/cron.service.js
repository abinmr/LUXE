import cron from "node-cron";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import Offer from "../models/offer.model.js";
import { removeOfferFromProducts } from "./offer.service.js";

async function cleanupExpiredOffers() {
    try {
        const now = new Date();
        const expiredOffers = await Offer.find({ isActive: true, endDate: { $lt: now } });
        if (expiredOffers.length === 0) return;
        for (const offer of expiredOffers) {
            await removeOfferFromProducts(offer._id);
            offer.isActive = false;
            await offer.save();
            console.log(`[Cron] Expired offer removed: ${offer.title || offer._id}`);
        }
    } catch (err) {
        console.error("[Cron] Error cleaning up expired offers:", err);
    }
}

export const initCronJob = async () => {
    // Run immediately on server startup to clear any offers that expired while server was down
    await cleanupExpiredOffers();

    // Also run every 15 minutes going forward
    cron.schedule("*/15 * * * *", cleanupExpiredOffers);

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
