import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import Order from "../models/order.model.js";
import { monthelyRevenue } from "../service/order.service.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    const { date } = req.query;
    let query = {};
    const now = new Date();
    if (date) {
        let startDate = new Date();
        let endDate = new Date();
        if (date === "today") {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (date === "week") {
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (date === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (date === "year") {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        if (["today", "week", "month", "year"].includes(date)) {
            query.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }
    }

    const transactions = await Order.find(query).sort({ createdAt: -1 }).limit(10);
    const totalOrders = transactions.length;
    const totalRevenue = transactions.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalProducts = transactions.reduce((sum, order) => {
        return sum + (order.total ? order.items.length : 0);
    }, 0);

    const revenue = await monthelyRevenue();

    return res.render("sales-report", {
        currentPage: "sales-report",
        transactions,
        totalOrders,
        totalRevenue,
        totalProducts,
        selectedDate: date || "all",
        revenueArray: revenue,
    });
});

export default router;
