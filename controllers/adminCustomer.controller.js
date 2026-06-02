import { getPaginatedUsers, getTotalUsers, userFindAndUpdate } from "../service/user.service.js";
import { serverError, success } from "../service/status.service.js";
import { CUSTOMER_MESSAGE } from "../constants/messages.js";

export const getAllCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";
    const selectStatus = req.query.customerStatus;
    let dbQuery = {};
    if (searchQuery) {
        dbQuery = {
            $or: [{ fullname: { $regex: searchQuery, $options: "i" } }, { email: { $regex: searchQuery, $options: "i" } }],
        };
    }

    if (selectStatus === "active") {
        dbQuery.isBlocked = false;
    } else if (selectStatus === "blocked") {
        dbQuery.isBlocked = true;
    }
    const userDetails = await getPaginatedUsers(dbQuery, skip, limit);
    const totalUsers = await getTotalUsers(dbQuery);
    const activeUsers = await getTotalUsers({ isBlocked: false });
    const blockedUsers = await getTotalUsers({ isBlocked: true });
    const userInfo = {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        revenue: userDetails.total || 0,
        status: selectStatus,
    };
    const totalPages = Math.ceil(totalUsers / limit);
    return res.render("customers", {
        users: userDetails,
        userInfo: userInfo,
        currentPageNumber: page,
        totalPages: totalPages,
        limit: limit,
        search: searchQuery,
    });
};

export const blockUser = async (req, res) => {
    try {
        const id = req.params.id;
        await userFindAndUpdate(id, { isBlocked: true });
        return res.status(success).json({ success: true, message: CUSTOMER_MESSAGE.BLOCK_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: err.message });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const id = req.params.id;
        await userFindAndUpdate(id, { isBlocked: false });
        return res.status(success).json({ success: true, message: CUSTOMER_MESSAGE.UNBLOCK_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: err.message });
    }
};
