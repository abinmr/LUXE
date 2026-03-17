import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
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
    const userDetails = await User.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(6);
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
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
});

router.get("/customers/filter", (req, res) => {
    const status = req.body;
    console.log("Status: ", status);
    console.log("code ran");
    return res.redirect("/admin/customers");
});

router.post("/block/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (user) {
            user.isBlocked = !user.isBlocked;
            await user.save();
        }

        return res.redirect("/admin/customers");
    } catch (err) {
        console.error("Error toggling block status:", err);
        return res.redirect("/admin/customers");
    }
});

export default router;
