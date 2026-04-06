import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import upload from "../lib/multer.js";
import { addCategory, deleteCategory, editCategoryDetails, getAddCategory, getCategories, getEditCategory } from "../controllers/adminCategory.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getCategories);

router.get("/add", requireAdminAuth, getAddCategory);

router.post("/add", requireAdminAuth, upload.single("image"), addCategory);

router.get("/edit/:id", requireAdminAuth, getEditCategory);

router.post("/edit/:id", requireAdminAuth, upload.single("image"), editCategoryDetails);

router.get("/delete/:id", requireAdminAuth, deleteCategory);

export default router;
