import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import upload from "../lib/multer.js";
import { addProduct, deleteProduct, editProductDetails, getAddPage, getEditPage, getProductPage, listProduct, unlistProduct } from "../controllers/adminProduct.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getProductPage);

router.get("/add", requireAdminAuth, getAddPage);

router.post("/add", upload.any(), addProduct);

router.get("/edit/:id", requireAdminAuth, getEditPage);

router.post("/edit/:id", upload.any(), editProductDetails);

router.patch("/list/:id", requireAdminAuth, listProduct);

router.patch("/unlist/:id", requireAdminAuth, unlistProduct);

router.delete("/delete/:id", requireAdminAuth, deleteProduct);

export default router;
