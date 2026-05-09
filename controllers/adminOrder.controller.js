import Order from "../models/order.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransation.model.js";
import { updateProduct } from "../service/product.service.js";
import { success } from "../service/status.service.js";

export const getOrdersPage = async (req, res) => {
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
};

export const orderDetailsById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate("userId");
    return res.render("orderProcessing", { order });
};

export const updateOrderDetails = async (req, res) => {
    try {
        const status = req.query.status;
        const order = await Order.findById(req.params.id);
        const terminalStates = ["cancelled", "return-requested", "returned"];
        for (const item of order.items) {
            if (!terminalStates.includes(item.orderStatus)) {
                item.orderStatus = status;
            }
        }
        if (status === "delivered") {
            order.estimatedDeliveryDate = new Date(Date.now());
        }
        await order.save();
        return res.redirect("/admin/orders");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
};

//FIX: fix the issue when user cancels order with upi or card refund their money

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const orderReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.redirect("/admin/orders");
        }
        let selectedIts = req.body.product || [];

        if (!Array.isArray(selectedIts)) {
            selectedIts = [selectedIts];
        }

        const refund = Number(req.body.refund);

        for (const itemId of selectedIts) {
            const item = order.items.id(itemId);
            if (!item) return;
            await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
            item.orderStatus = "returned";
            item.paymentStatus = "refunded";
            item.adminNote = req.body["admin-note"] || "";
        }
        await order.save();
        const userId = order.userId;
        const wallet = await Wallet.findOne({ userId: userId });
        const userWallet = wallet || (await Wallet.create({ userId: userId, balance: 0 }));
        const transaction = await WalletTransaction.create({
            walletId: userWallet._id,
            userId: userId,
            orderId: order.orderId,
            transactionType: "credit",
            amount: refund,
            description: req.body["admin-note"] || "refund for returned order",
            status: "completed",
        });
        userWallet.balance = userWallet.balance + refund;
        await userWallet.save();
        return res.status(success).json({ success: true, message: "money refunded", returnedItems: selectedIts });
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
};
