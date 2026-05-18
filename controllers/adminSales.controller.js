import Order from "../models/order.model.js";
import { monthelyRevenue } from "../service/order.service.js";
import { generateSalesReportExcel, generateSalesReportPDF, getDates } from "../service/sales.service.js";

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const getSalesReportPage = async (req, res) => {
    const { date } = req.query;
    let query = {};
    if (date) {
        const { startDate, endDate } = await getDates(date);

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
};

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const downloadSalesPDF = async (req, res) => {
    try {
        const date = req.query.date || "all";
        let query = {};
        let displayStartDate = "All Time";
        let displayEndDate = "Today";

        if (date !== "all") {
            const { startDate, endDate } = await getDates(date);
            query.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };

            displayStartDate = new Date(startDate).toLocaleDateString("en-IN");
            displayEndDate = new Date(endDate).toLocaleDateString("en-IN");
        }

        const orders = await Order.find(query);
        let totalRevenue = 0;
        let totalDiscount = 0;
        let netSales = 0;

        orders.forEach((order) => {
            totalRevenue += order.subtotal || 0;
            totalDiscount += (order.discount || 0) + (order.offerDiscount || 0);
            netSales += order.total || 0;
        });

        const reportData = {
            startDate: displayStartDate,
            endDate: displayEndDate,
            totalOrders: orders.length,
            totalRevenue,
            totalDiscount,
            netSales,
            orders,
        };

        await generateSalesReportPDF(reportData, res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating PDF");
    }
};

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const downloadSalesExcel = async (req, res) => {
    try {
        const date = req.query.date || "all";

        let query = {};
        let displayStartDate = "All Time";
        let displayEndDate = "Today";

        if (date !== "all") {
            const { startDate, endDate } = await getDates(date);
            query.createdAt = { $gte: startDate, $lte: endDate };
            displayStartDate = new Date(startDate).toLocaleDateString("en-IN");
            displayEndDate = new Date(endDate).toLocaleDateString("en-IN");
        }

        const orders = await Order.find(query);
        let revenue = 0,
            totalDiscount = 0,
            netSales = 0;

        orders.forEach((order) => {
            revenue += order.subtotal || 0;
            totalDiscount += (order.discount || 0) + (order.offerDiscount || 0);
            netSales += order.total || 0;
        });

        const reportData = {
            startDate: displayStartDate,
            endDate: displayEndDate,
            totalOrders: orders.length,
            totalRevenue: revenue,
            totalDiscount,
            netSales,
            orders,
        };

        await generateSalesReportExcel(reportData, res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating Excel");
    }
};
