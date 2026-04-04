import fs from "fs/promises";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getProductPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const dbQuery = { isDeleted: false };
    const limit = 6;
    let skip = (page - 1) * limit;
    const productError = req.flash("productError")[0];
    if (search) {
        JSON.stringify((dbQuery.$or = [{ name: { $regex: search, $options: "i" } }]));
    }
    const products = await Product.find(dbQuery).populate("category").lean().skip(skip).limit(limit);
    for (const product of products) {
        const allSizes = (product.variants || []).flatMap((v) => v.sizes);
        product.totalStock = allSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }
    const totalProductCount = await Product.countDocuments(dbQuery);
    const totalPages = Math.ceil(totalProductCount / limit);
    return res.render("products", {
        productError: productError || null,
        products,
        currentPage: page,
        totalPages,
        limit,
    });
};

export const getAddPage = async (req, res) => {
    const categories = await Category.find({ isDeleted: false, isActive: true });
    return res.render("productAdd", { categories });
};

export const addProduct = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { productName, productDescription, category, listing } = req.body;
        if (!productName || !productDescription || !category || !listing) {
            req.flash("productError", "Please provide all the details");
            return res.redirect("/product/add");
        }
        const isListed = listing === "list";
        const rawVariants = req.body.variants || {};

        const variantImages = {};
        for (const file of req.files) {
            const match = file.fieldname.match(/variants\[(\d+)\]\[newImages\]/);
            if (match) {
                const vi = parseInt(match[1]);
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    folder: "products",
                    allowed_formats: ["jpg", "png", "webp"],
                });
                await fs.unlink(file.path).catch((err) => console.error(err));
                if (!variantImages[vi]) variantImages[vi] = [];
                variantImages[vi].push(uploadResult.secure_url);
            }
        }

        const variants = Object.entries(rawVariants).map(([i, variant]) => ({
            color: variant.color,
            images: variantImages[parseInt(i)] || [],
            sizes: Array.isArray(variant.sizes) ? variant.sizes : variant.sizes ? [variant.sizes] : [],
        }));

        await Product.create({
            name: productName,
            description: productDescription,
            category,
            isListed,
            variants,
        });

        return res.redirect("/admin/products");
    } catch (err) {
        req.flash("productError", "Error saving product");
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const getEditPage = async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category").lean();
    const categories = await Category.find({ isDeleted: false });
    return res.render("productEdit", { product, categories });
};

export const editProductDetails = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const id = req.params.id;
        const { productName, productDescription, category, listing } = req.body;
        const isListed = listing === "list";
        const rawVariants = req.body.variants || {};

        const variantNewImages = {};
        for (const file of req.files) {
            const match = file.fieldname.match(/variants\[(\d+)\]\[newImages\]/);
            if (match) {
                const vi = parseInt(match[1]);
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    folder: "products",
                    allowed_formats: ["jpg", "png", "webp"],
                });
                await fs.unlink(file.path).catch((err) => console.error(err));
                if (!variantNewImages[vi]) variantNewImages[vi] = [];
                variantNewImages[vi].push(uploadResult.secure_url);
            }
        }

        const variants = Object.entries(rawVariants).map(([i, variant]) => {
            const vi = parseInt(i);
            const existingImages = variant.existingImages ? (Array.isArray(variant.existingImages) ? variant.existingImages : [variant.existingImages]) : [];
            const newImages = variantNewImages[vi] || [];

            let rawSizes = variant.sizes ? Object.values(variant.sizes) : [];
            let mappedSizes = rawSizes.map((size) => {
                let sObj = { ...size };
                if (!sObj._id || sObj._id.trim() === "") delete sObj._id;
                return sObj;
            });

            let vObj = {
                color: variant.color,
                images: [...existingImages, ...newImages],
                sizes: mappedSizes,
            };
            if (variant._id && variant._id.trim() !== "") {
                vObj._id = variant._id;
            }
            return vObj;
        });

        await Product.findByIdAndUpdate(id, {
            name: productName,
            description: productDescription,
            category,
            isListed,
            variants,
        });

        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const listProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { isListed: true });
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const unlistProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { isListed: false });
        return res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { isDeleted: true });
        return res.status(200).json({ success: true, message: "product deleted successfully " });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err, message: "Server failure" });
    }
};
