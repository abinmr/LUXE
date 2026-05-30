import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { blockCustomer, blockUser, getAllCustomers, unblockUser } from "../controllers/adminCustomer.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getAllCustomers);

router.patch("/block/:id", requireAdminAuth, blockUser);

router.patch("/unblock/:id", requireAdminAuth, unblockUser);

export default router;
