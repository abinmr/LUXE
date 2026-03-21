import express from "express";
import fs from "fs/promises";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import Product from "../models/product.model.js";
import Variants from "../models/variant.model.js";
import Category from "../models/category.model.js";
import upload from "../lib/multer.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const productError = req.flash("productError")[0];
    const products = await Product.find({ isDeleted: false }).populate("category").lean();
    for (const product of products) {
        const variants = await Variants.find({ productId: product._id }).lean();
        const allVariants = variants.flatMap((v) => v.sizes);
        product.variants = variants;
        product.totalStock = allVariants.reduce((sum, s) => sum + s.stock, 0);
    }
    const totalPage = products.length;
    return res.render("products", {
        currentPage: "products",
        productError: productError,
        products,
        currentPage: page,
        totalPage: totalPage,
        limit: limit,
    });
});

router.get("/add", requireAdminAuth, async (req, res) => {
    const categories = await Category.find({ isDeleted: false });
    return res.render("productAdd", { categories });
});

router.post("/add", upload.any(), async (req, res) => {
    try {
        const { productName, productDescription, category, listing } = req.body;
        const variants = Array.isArray(req.body.variants) ? req.body.variants : [req.body.variants];
        console.log("variants", variants);
        console.log("files", req.files);
        // return res.redirect("/admin/products/add");
        const isListed = listing === "list" ? true : false;
        const product = await Product.create({ name: productName, description: productDescription, category: category, isListed: isListed });
        await product.save();
        const imageUrls = [];
        for (const file of req.files) {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: "products",
                allowed_formats: ["jpg", "png", "webp"],
            });
            await fs.unlink(file.path).catch((err) => console.console.error(err));
            imageUrls.push(uploadResult.secure_url);
        }

        const variantWithProductId = variants.map((variant, i) => ({
            productId: product._id,
            color: variant.color,
            image: imageUrls[i] || "",
            sizes: Array.isArray(variant.sizes) ? variant.sizes : [variant.sizes],
        }));
        const variantCollection = await Variants.insertMany(variantWithProductId);
        console.log(variantCollection);
        return res.redirect("/admin/products");
    } catch (err) {
        req.flash("productError", "Error saving products");
        console.error(err);
        return res.redirect("/admin/products");
    }
});

router.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id).populate("category");
    const category = await Category.find({ isDeleted: false });
    const variants = await Variants.find({ productId: product._id });
    return res.render("productEdit", { product: product, categories: category, variants: variants });
});

router.post("/edit/:id", upload.any(), async (req, res) => {
    try {
        const id = req.params.id;
        const { productName, productDescription, category, listing } = req.body;
        const isListed = listing === "list" ? true : false;
        const result = await Product.findByIdAndUpdate(id, { name: productName, description: productDescription, category: category, isListed: isListed });
        const variants = Array.isArray(req.body.variants) ? req.body.variants : [req.body.variants];
        const imageUrls = [];
        for (const file of req.files) {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: "products",
                allowed_formats: ["jpg", "png", "webp"],
            });
            await fs.unlink(file.path).catch((err) => console.error(err));
            imageUrls.push(uploadResult.secure_url);
        }

        const currentVariants = await Variants.find({ productId: id }).lean();
        await Variants.deleteMany({ productId: id });
        const updatedVariants = variants.map((variant, i) => ({
            productId: id,
            color: variant.color,
            image: imageUrls[i] || currentVariants[i]?.image || "",
            sizes: Array.isArray(variant.sizes) ? variant.sizes : [variant.sizes],
        }));

        await Variants.insertMany(updatedVariants);
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
    }
});

router.get("/list/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Product.findByIdAndUpdate(id, { isListed: true });
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
});

router.get("/unlist/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Product.findByIdAndUpdate(id, { isListed: false });
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
});

router.get("/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Product.findByIdAndUpdate(id, { isDeleted: true });
        console.log(result);
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
});

export default router;
