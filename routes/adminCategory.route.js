import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";

const router = express.Router();

router.get("/", requireAdminAuth, (req, res) => {
    return res.render("categories", { currentPage: "categories" });
});

export default router;
