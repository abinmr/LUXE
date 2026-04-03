import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { blockCustomer, getAllCustomers } from "../controllers/adminCustomer.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getAllCustomers);

router.post("/block/:id", blockCustomer);

export default router;
