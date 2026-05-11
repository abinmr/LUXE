import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";

const router = express.Router();

router.get("/", requireAdminAuth, (req, res) => {
    return res.render("offers", { currentPage: "offers" });
});

router.get("/add", requireAdminAuth, (req, res) => {
    return res.render("offerAdd");
});

export default router;
