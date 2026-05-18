import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { downloadSalesExcel, downloadSalesPDF, getSalesReportPage } from "../controllers/adminSales.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getSalesReportPage);

router.get("/pdf", requireAdminAuth, downloadSalesPDF);

router.get("/excel", requireAdminAuth, downloadSalesExcel);

export default router;
