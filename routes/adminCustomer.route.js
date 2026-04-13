import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { blockCustomer, getAllCustomers } from "../controllers/adminCustomer.controller.js";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, getAllCustomers);

router.post("/block/:id", blockCustomer);

router.patch("/block/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await User.findByIdAndUpdate(id, { isBlocked: true });
        return res.status(200).json({ success: true, message: "user blocked successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err });
    }
});

router.patch("/unblock/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await User.findByIdAndUpdate(id, { isBlocked: false });
        return res.status(200).json({ success: true, message: "user unblocked successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err });
    }
});

export default router;
