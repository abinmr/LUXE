import { getSortedOrders, monthelyRevenue } from "../service/order.service.js";
import { generateSalesReportExcel, generateSalesReportPDF, getDates } from "../service/sales.service.js";

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const getSalesReportPage = async (req, res) => {
    const { date, startDate, endDate } = req.query;
    let query = {};
    if (date) {
        if (date === "custom" && startDate && endDate) {
            query.createdAt = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else {
            const { startDate, endDate } = await getDates(date);
            if (["today", "week", "month", "year"].includes(date)) {
                query.createdAt = {
                    $gte: startDate,
                    $lte: endDate,
                };
            }
        }
    }

    const allOrders = await getSortedOrders(query);
    const totalOrders = allOrders.length;
    const totalRevenue = Math.round(allOrders.reduce((sum, order) => sum + (order.total || 0), 0));
    const totalProducts = allOrders.reduce((sum, order) => {
        return sum + (order.total ? order.items.length : 0);
    }, 0);
    const revenue = await monthelyRevenue();
    const transactions = allOrders.slice(0, 10);

    return res.render("sales-report", {
        currentPage: "sales-report",
        transactions,
        totalOrders,
        totalRevenue,
        totalProducts,
        selectedDate: date || "all",
        revenueArray: revenue,
        startDate: startDate || "",
        endDate: endDate || "",
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
            let start, end;
            if (date === "custom" && req.query.startDate && req.query.endDate) {
                start = new Date(new Date(req.query.startDate).setHours(0, 0, 0, 0));
                end = new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999));
            } else {
                const { startDate, endDate } = await getDates(date);
                start = startDate;
                end = endDate;
            }
            query.createdAt = {
                $gte: start,
                $lte: end,
            };

            displayStartDate = new Date(start).toLocaleDateString("en-IN");
            displayEndDate = new Date(end).toLocaleDateString("en-IN");
        }

        const orders = await getSortedOrders(query);
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
            let start, end;
            if (date === "custom" && req.query.startDate && req.query.endDate) {
                start = new Date(new Date(req.query.startDate).setHours(0, 0, 0, 0));
                end = new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999));
            } else {
                const { startDate, endDate } = await getDates(date);
                start = startDate;
                end = endDate;
            }
            query.createdAt = {
                $gte: start,
                $lte: end,
            };
            displayStartDate = new Date(start).toLocaleDateString("en-IN");
            displayEndDate = new Date(end).toLocaleDateString("en-IN");
        }

        const orders = await getSortedOrders(query);
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
