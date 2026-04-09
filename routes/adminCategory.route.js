import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import upload from "../lib/multer.js";
import { addCategory, deleteCategory, editCategoryDetails, getAddCategory, getCategories, getEditCategory } from "../controllers/adminCategory.controller.js";
import Category from "../models/category.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, getCategories);

router.get("/add", requireAdminAuth, getAddCategory);

router.post("/add", requireAdminAuth, upload.single("image"), addCategory);

router.patch("/status/active/:id", requireAdminAuth, async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, { isActive: true });
        return res.status(200).json({ success: true, message: "category status updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err });
    }
});

router.patch("/status/inactive/:id", requireAdminAuth, async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, { isActive: false });
        return res.status(200).json({ success: true, message: "category status updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err });
    }
});

router.get("/edit/:id", requireAdminAuth, getEditCategory);

router.post("/edit/:id", requireAdminAuth, upload.single("image"), editCategoryDetails);

router.get("/delete/:id", requireAdminAuth, deleteCategory);

export default router;
