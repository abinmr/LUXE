import express from "express";
import Order from "../models/order.model.js";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const customerStatus = req.query.customerStatus;
        const limit = 6;
        const skip = (page - 1) * limit;
        let dbQuery = {};
        if (search) {
            dbQuery = {
                $or: [{ username: { $regex: search, $options: "i" } }, { orderId: { $regex: search, $options: "i" } }],
            };
        }
        if (customerStatus === "processing") {
            dbQuery.orderStatus = "processing";
        } else if (customerStatus === "pending") {
            dbQuery.orderStatus = "pending";
        }
        const orders = await Order.find(dbQuery).skip(skip).limit(limit);
        const totalOrders = await Order.countDocuments(dbQuery);
        const totalPages = Math.ceil(totalOrders / limit);
        return res.render("orders", {
            currentPage: "orders",
            orders,
            totalPages: totalPages,
            limit,
            search: search,
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
        const update = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status });
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
        const selectedIts = req.body.product;

        for (const itemId of selectedIts) {
            const item = order.items.id(itemId);
            if (!item) return;

            await Product.updateOne(
                {
                    _id: item.productId,
                    "variants._id": item.variantId,
                    "variants.sizes._id": item.sizeId,
                },
                {
                    $inc: { "variants.$[v].sizes.$[s].stock": item.quantity },
                },
                {
                    arrayFilters: [{ "v._id": item.variantId }, { "s._id": item.sizeId }],
                },
            );
        }
        order.orderStatus = "returned";
        order.paymentStatus = "refunded";
        order.adminNote = req.body["admin-note"] || "";
        await order.save();
        return res.redirect(`/admin/orders/${order._id}`);
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
});

export default router;
