import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { getOrdersPage, orderDetailsById, orderReturn, updateOrderDetails } from "../controllers/adminOrder.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getOrdersPage);

router.get("/:id", requireAdminAuth, orderDetailsById);

router.get("/:id/update", requireAdminAuth, updateOrderDetails);

router.patch("/:id/approve-return", requireAdminAuth, orderReturn);

export default router;
