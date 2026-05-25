import { findUserById, getPaginatedUsers, getTotalUsers } from "../service/user.service.js";

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
    const activeUsers = await getTotalUsers({ isBlocked: true });
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

export const blockCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await findUserById(id);
        if (user) {
            user.isBlocked = !user.isBlocked;
            await user.save();
        }
        return res.redirect("/admin/customers");
    } catch (err) {
        console.error("Error toggling block status:", err);
        return res.redirect("/admin/customers");
    }
};
