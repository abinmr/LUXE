import { getOrderById, getOrderWithUser, getPaginatedOrder, getTotalOrders } from "../service/order.service.js";
import { updateProduct } from "../service/product.service.js";
import { findUserById } from "../service/user.service.js";
import { createWalletTransaction, getUserWallet } from "../service/wallet.service.js";
import { success } from "../service/status.service.js";
import { ORDER_MESSAGE } from "../constants/messages.js";

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
        const orders = await getPaginatedOrder(dbQuery, skip, limit);
        const totalOrders = await getTotalOrders(dbQuery);
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
    const order = await getOrderWithUser(req.params.id);
    return res.render("orderProcessing", { order });
};

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const updateOrderDetails = async (req, res) => {
    try {
        const status = req.query.status;
        const order = await getOrderById(req.params.id);
        const terminalStates = ["cancelled", "return-requested", "returned"];
        for (const item of order.items) {
            if (!terminalStates.includes(item.orderStatus)) {
                item.orderStatus = status;
            }
        }
        if (status === "delivered") {
            order.estimatedDeliveryDate = new Date(Date.now());
            const user = await findUserById(order.userId);
            if (user && user.referredBy && !user.referralBonusGranted) {
                const bonusAmount = 100;
                let referrerWallet = await getUserWallet(user.referredBy);
                referrerWallet.balance = Math.round((referrerWallet.balance + bonusAmount) * 100) / 100;
                await referrerWallet.save();
                const data = {
                    walletId: referrerWallet._id,
                    userId: user.referredBy,
                    referenceModel: "User",
                    referenceId: user._id,
                    transactionType: "credit",
                    amount: bonusAmount,
                    description: `Referral bonus for inviting ${user.fullname || `a new user`}!`,
                    status: "completed",
                };
                await createWalletTransaction(data);
                user.referralBonusGranted = true;
                await user.save();
            }
            order.paymentStatus = "paid";
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
        const order = await getOrderById(req.params.id);
        if (!order) {
            return res.redirect("/admin/orders");
        }
        let selectedIts = req.body.product || [];

        if (!Array.isArray(selectedIts)) {
            selectedIts = [selectedIts];
        }

        let validItems = 0;
        let calculatedRefund = 0;

        for (const itemId of selectedIts) {
            const item = order.items.id(itemId);
            if (!item || item.orderStatus === "returned") continue;

            const itemTotalValue = item.price * item.quantity;
            const itemProportion = itemTotalValue / order.subtotal;

            const proportionalGST = itemProportion * order.GST;
            const proportionalDiscount = itemProportion * (order.discount || 0);

            calculatedRefund += itemTotalValue + proportionalGST - proportionalDiscount;

            await updateProduct(item.productId, item.variantId, item.sizeId, item.quantity);
            item.orderStatus = "returned";
            item.paymentStatus = "refunded";
            item.adminNote = req.body["admin-note"] || "";
            validItems++;
        }

        if (validItems === 0) {
            return res.status(400).json({ success: false, message: ORDER_MESSAGE.INVALID_ITEMS });
        }

        const refund = Math.round(calculatedRefund * 100) / 100;
        order.paymentStatus = "refunded";
        await order.save();

        const userId = order.userId;
        const userWallet = await getUserWallet(userId);
        const data = {
            walletId: userWallet._id,
            userId: userId,
            orderId: order.orderId,
            transactionType: "credit",
            amount: refund,
            description: req.body["admin-note"] || "refund for returned order",
            status: "completed",
        };
        const transaction = await createWalletTransaction(data);
        userWallet.balance = Math.round((userWallet.balance + refund) * 100) / 100;
        await userWallet.save();
        return res.status(success).json({ success: true, message: `Item returned. ₹${refund} refunded`, returnedItems: selectedIts });
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/orders");
    }
};
