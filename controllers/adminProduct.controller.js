import fs from "fs/promises";
import cloudinary from "../lib/cloudinary.js";
import { serverError, success } from "../service/status.service.js";
import { createProduct, getPaginatedProducts, getProductWithCateogory, getTotalDocuments, updateProductById, getProducts } from "../service/product.service.js";
import { getAllActiveCategories, getAllCategories } from "../service/adminCategory.service.js";
import { PRODUCT_MESSAGE } from "../constants/messages.js";

export const getProductPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const dbQuery = { isDeleted: false };
    const limit = 7;
    let skip = (page - 1) * limit;
    const productError = req.flash("productError")[0];
    if (search) {
        dbQuery.$or = [{ name: { $regex: search, $options: "i" } }];
    }
    const products = await getPaginatedProducts(dbQuery, skip, limit);
    for (const product of products) {
        const allSizes = (product.variants || []).flatMap((v) => v.sizes);
        product.totalStock = allSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }
    const totalProductCount = await getTotalDocuments(dbQuery);
    const totalPages = Math.ceil(totalProductCount / limit);
    return res.render("products", {
        productError: productError || null,
        products,
        currentPage: page,
        totalPages,
        limit,
        search,
    });
};

export const getAddPage = async (req, res) => {
    const categories = await getAllActiveCategories();
    const oldData = {};
    return res.render("productAdd", { categories, oldData });
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const addProduct = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { productName, productDescription, category, listing } = req.body;
        const isListed = listing === "list";

        req.body.name = productName;
        req.body.description = productDescription;
        req.body.isListed = isListed;

        const rawVariants = req.body.variants || {};
        const variantsArray = Array.isArray(rawVariants) ? rawVariants : Object.values(rawVariants);

        const variants = variantsArray.map((variant) => {
            const croppedImages = variant.croppedImages ? (Array.isArray(variant.croppedImages) ? variant.croppedImages : [variant.croppedImages]) : [];

            let rawSizes = variant.sizes ? (Array.isArray(variant.sizes) ? variant.sizes : Object.values(variant.sizes)) : [];
            let sizes = rawSizes.map((sz) => ({
                size: sz.size || "",
                price: sz.price || "",
                compareAtPrice: sz.compareAtPrice || "",
                stock: sz.stock || "",
            }));

            return {
                color: variant.color || "",
                croppedImages,
                sizes,
            };
        });

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const match = file.fieldname.match(/variants\[(\d+)\]\[newImages\]/);
                if (match) {
                    const vi = parseInt(match[1]);
                    const fileBuffer = await fs.readFile(file.path);
                    const base64 = `data:${file.mimetype};base64,${fileBuffer.toString("base64")}`;

                    if (!variants[vi]) {
                        variants[vi] = { color: "", croppedImages: [], sizes: [] };
                    }
                    variants[vi].croppedImages.push(base64);

                    await fs.unlink(file.path).catch((err) => console.error(err));
                }
            }
        }

        req.body.variants = variants;

        if (!productName || !productDescription || !category || !listing) {
            const categories = await getAllActiveCategories();
            return res.render("productAdd", {
                categories,
                productError: "Please provide all the details",
                oldData: req.body,
            });
        }

        const nameExist = await getProducts({
            name: { $regex: `^${productName}$`, $options: "i" },
            isDeleted: false,
        });
        if (nameExist.length > 0) {
            const categories = await getAllActiveCategories();
            return res.render("productAdd", {
                categories,
                productError: "product name already exists",
                oldData: req.body,
            });
        }

        // Upload images to Cloudinary
        const uploadedVariants = [];
        for (const variant of variants) {
            const imageUrls = [];
            for (const base64 of variant.croppedImages) {
                const uploadResult = await cloudinary.uploader.upload(base64, {
                    folder: "products",
                    allowed_formats: ["jpg", "png", "webp"],
                });
                imageUrls.push(uploadResult.secure_url);
            }
            uploadedVariants.push({
                color: variant.color,
                images: imageUrls,
                sizes: variant.sizes,
            });
        }

        const data = {
            name: productName,
            description: productDescription,
            category,
            isListed,
            variants: uploadedVariants,
        };
        await createProduct(data);

        return res.redirect("/admin/products");
    } catch (err) {
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch((err) => console.error(err));
            }
        }
        req.flash("productError", "Error saving product");
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const getEditPage = async (req, res) => {
    const product = await getProductWithCateogory(req.params.id);
    const categories = await getAllCategories();
    return res.render("productEdit", { product, categories });
};

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
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

        const updateData = {
            name: productName,
            description: productDescription,
            category,
            isListed,
            variants,
        };

        await updateProductById(id, updateData);

        return res.redirect("/admin/products");
    } catch (err) {
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch((err) => console.error(err));
            }
        }
        console.error(err);
        return res.redirect("/admin/products");
    }
};

export const listProduct = async (req, res) => {
    try {
        await updateProductById(req.params.id, { isListed: true });
        return res.status(success).json({ success: true, message: PRODUCT_MESSAGE.LIST_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, error: err });
    }
};

export const unlistProduct = async (req, res) => {
    try {
        await updateProductById(req.params.id, { isListed: false });
        return res.status(success).json({ success: true, message: PRODUCT_MESSAGE.UNLIST_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, error: err });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await updateProductById(req.params.id, { isDeleted: true });
        return res.status(success).json({ success: true, message: PRODUCT_MESSAGE.DELETE_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ error: err, message: "Server failure" });
    }
};
