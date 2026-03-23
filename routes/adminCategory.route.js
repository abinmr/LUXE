import express from "express";
import fs from "fs";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import Category from "../models/category.model.js";
import upload from "../lib/multer.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    let dbQuery = { isDeleted: false };
    if (search) {
        dbQuery.$or = [{ name: { $regex: search, $options: "i" } }, { slug: { $regex: search, $options: "i" } }];
    }
    console.log("dbQuery", dbQuery);
    const totalCategory = await Category.countDocuments();
    const categories = await Category.find(dbQuery).skip(skip).limit(limit).sort({ createdAt: -1 });
    const totalPage = Math.ceil(totalCategory / limit);
    return res.render("categories", {
        currentPage: "categories",
        categories: categories,
        currentPage: page,
        totalPage: totalPage,
        limit: limit,
    });
});

router.get("/add", requireAdminAuth, (req, res) => {
    const categoryError = req.flash("categoryError")[0];
    const nameError = req.flash("nameError")[0];
    const slugError = req.flash("slugError")[0];
    const imageError = req.flash("imageError")[0];
    return res.render("categoryAdd", { categoryError, nameError, slugError, imageError });
});

router.post("/add", requireAdminAuth, upload.single("image"), async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { categoryName, slug, description, active } = req.body;
        if (categoryName === "" || description === "") {
            req.flash("categoryError", "All fields are required");
            return res.redirect("/admin/categories/add");
        }

        const nameExist = await Category.findOne({ name: { $regex: `^${categoryName}$`, $options: "i" } });
        if (nameExist) {
            req.flash("nameError", "category name already exist");
            return res.redirect("/admin/categories/add");
        }

        const slugExist = await Category.findOne({ slug: slug });
        if (slugExist) {
            req.flash("slugError", "slug already exist");
            return res.redirect("/admin/categories/add");
        }

        if (!req.file) {
            req.flash("imageError", "Image is required");
            return res.redirect("/admin/categories/add");
        }

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "categories",
            allowed_formats: ["jpg", "png", "webp"],
        });

        await fs.promises.unlink(req.file.path).catch((err) => console.error(err));

        const isActive = active === "on" || active === true;
        const category = await Category.create({ name: categoryName, slug: slug, description: description, isActive: isActive, image: uploadResult.secure_url });
        await category.save();
        return res.redirect("/admin/categories");
    } catch (err) {
        if (req.file) {
            await fs.promises.unlink(req.file.path);
        }
        console.error(err);
        req.flash("categoryError", "something went wrong");
        return res.redirect("/admin/categories/add");
    }
});

router.get("/edit/:id", requireAdminAuth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        return res.render("categoryEdit", { category });
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/categories");
    }
});

router.post("/edit/:id", requireAdminAuth, upload.single("image"), async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const id = req.params.id;
        const { categoryName, slug, description, active } = req.body;
        const updatedData = {
            name: categoryName,
            description: description,
            slug: slug,
            isActive: active === "on" || active === true,
        };
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "categories",
                allowed_formats: ["jpg", "png", "webp"],
            });
            await fs.promises.unlink(req.file.path).catch((err) => console.log(err));
            updatedData.image = result.secure_url;
        }
        await Category.findByIdAndUpdate(id, updatedData);
        return res.redirect("/admin/categories");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/categories");
    }
});

router.get("/delete/:id", requireAdminAuth, async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
        return res.redirect("/admin/categories");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/categories");
    }
});

export default router;
