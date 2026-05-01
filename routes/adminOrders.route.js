import express from "express";
import Order from "../models/order.model.js";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { updateProduct } from "../service/product.service.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const customerStatus = req.query.customerStatus;
        const limit = 10;
        const skip = (page - 1) * limit;
        let dbQuery = {};
        if (search) {
            dbQuery = {
                $or: [{ username: { $regex: search, $options: "i" } }, { orderId: { $regex: search, $options: "i" } }],
            };
        }
        if (customerStatus && customerStatus !== "all-status") {
            dbQuery["items.orderStatus"] = customerStatus;
        }
        const orders = await Order.find(dbQuery).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalOrders = await Order.countDocuments(dbQuery);
        const totalPages = Math.ceil(totalOrders / limit);
        return res.render("orders", {
            currentPage: "orders",
            orders,
            totalPages: totalPages,
            limit,
            search: search,
            customerStatus,
            currentPageNumber: page,
        });
    } catch (err) {
        console.error(err);
    }
});

router.get("/:id", async (req, res) => {
    const order = await Order.findById(req.params.id).populate("userId");
    return res.render("orderProcessing", { order });
});

router.get("/:id/update", async (req, res) => {
    try {
        const status = req.query.status;
        const order = await Order.findById(req.params.id);
        for (const item of order.items) {
            item.orderStatus = status;
            if (status === "delivered") {
                item.estimatedDeliveryDate = new Date(Date.now());
            }
        }
        await order.save();
        return res.redirect("/admin/orders");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
});

router.post("/:id/approve-return", requireAdminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.redirect("/admin/orders");
        }
        let selectedIts = req.body.product || [];

        if (!Array.isArray(selectedIts)) {
            selectedIts = [selectedIts];
        }

        for (const itemId of selectedIts) {
            const item = order.items.id(itemId);
            if (!item) return;
            await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
            item.orderStatus = "returned";
            item.paymentStatus = "refunded";
            item.adminNote = req.body["admin-note"] || "";
        }
        await order.save();
        return res.status(200).json({ success: true, message: "money refunded", returnedItems: selectedIts });
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
});

export default router;
