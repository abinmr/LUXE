import fs from "fs";
import Offer from "../models/offer.model.js";
import { getAllCategories } from "../service/adminCategory.service.js";
import { offerSchema } from "../validators/offer.validator.js";
import { getAllProducts } from "../service/product.service.js";
import cloudinary from "../lib/cloudinary.js";
import { success } from "zod";
import { applyOffersToProducts, removeOfferFromProducts } from "../service/offer.service.js";

/**
 * @param {import('express').Request} req -
 * @param {import('express').Response} res -
 */
export const getOffersPage = async (req, res) => {
    try {
        const search = req.query.search || "";
        let dbQuery = { isDeleted: false };
        if (search) {
            dbQuery = {
                $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
            };
        }
        const offers = await Offer.find(dbQuery);
        return res.render("offers", { currentPage: "offers", offers, search });
    } catch (err) {
        console.error(err);
    }
};

export const getOfferAddPage = async (req, res) => {
    const categories = await getAllCategories();
    const products = await getAllProducts();
    const offerError = req.flash("offerError")[0];
    const offerImageError = req.flash("offerImageError")[0];
    return res.render("offerAdd", { categories, products, offerError, offerImageError, errors: {}, oldData: {} });
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const addNewOffers = async (req, res) => {
    const products = await getAllProducts();
    const categories = await getAllCategories();

    const validateData = offerSchema.safeParse({ ...req.body });

    if (!validateData.success) {
        const errors = {};
        validateData.error.issues.forEach((err) => {
            errors[err.path[0]] = err.message;
        });
        return res.render("offerAdd", {
            errors,
            oldData: req.body,
            products,
            categories,
        });
    }

    try {
        const data = validateData.data;

        if (data.applicableTo === "category") delete data.applicableProducts;
        else if (data.applicableTo === "products") delete data.applicableCategories;
        else {
            delete data.applicableCategories;
            delete data.applicableProducts;
        }

        if (data.applicableTo === "all") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "all", isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Their is already an offer available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "category") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "category", applicableCategories: { $in: data.applicableCategories }, isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Offer for these categories is already available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "products") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "products", applicableProducts: { $in: data.applicableProducts }, isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Offer for these products are already available", oldData: req.body, products, categories });
            }
        }

        if (!req.file) {
            throw new Error("image is required");
        }
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "offers",
            allowed_formats: ["jpg", "png", "webp"],
        });

        await fs.promises.unlink(req.file.path).catch((err) => console.log(err));

        const result = await Offer.create({ ...data, image: uploadResult.secure_url });
        await applyOffersToProducts(result);

        return res.redirect("/admin/offers");
    } catch (error) {
        if (req.file) {
            await fs.promises.unlink(req.file.path).catch((err) => console.error(err));
        }
        console.error(error);
        return res.render("offerAdd", {
            errors: { general: "Something went wrong. Please try again." },
            oldData: req.body,
            products,
            categories,
        });
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getOffersEditPage = async (req, res) => {
    try {
        const id = req.params.id;
        const offers = await Offer.findById(id);
        const categories = await getAllCategories();
        const products = await getAllProducts();
        const errors = {};
        return res.render("offersEdit", { offers, categories, products, errors });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateOffersDetails = async (req, res) => {
    const id = req.params.id;
    const categories = await getAllCategories();
    const products = await getAllProducts();

    const validateData = offerSchema.safeParse({ ...req.body });

    if (!validateData.success) {
        const errors = {};
        validateData.error.issues.forEach((err) => {
            errors[err.path[0]] = err.message;
        });
        const offers = await Offer.findById(id);
        return res.render("offersEdit", { offers, categories, products, errors });
    }
    try {
        const data = validateData.data;
        if (data.applicableTo === "category") delete data.applicableProducts;
        else if (data.applicableTo === "products") delete data.applicableCategories;
        else {
            delete data.applicableCategories;
            delete data.applicableProducts;
        }

        if (data.applicableTo === "all") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "all", isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Their is already an offer available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "category") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "category", applicableCategories: { $in: data.applicableCategories }, isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Offer for these categories is already available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "products") {
            const anyActiveOffer = await Offer.findOne({ applicableTo: "products", applicableProducts: { $in: data.applicableProducts }, isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Offer for these products are already available", oldData: req.body, products, categories });
            }
        }

        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "offers",
                allowed_formats: ["jpg", "png", "webp"],
            });
            await fs.promises.unlink(req.file.path).catch((err) => console.log(err));
            data.image = uploadResult.secure_url;
        }
        const result = await Offer.findByIdAndUpdate(id, { ...data }, { new: true });
        await removeOfferFromProducts(result._id);

        if (result.isActive) {
            await applyOffersToProducts(result);
        }
        return res.redirect("/admin/offers");
    } catch (err) {
        if (req.file) {
            await fs.promises.unlink(req.file.path).catch((err) => console.error(err));
        }
        console.error(err);
        const offers = await Offer.findById(id);
        return res.render("offersEdit", {
            offers,
            categories,
            products,
            errors: { general: "Something went wrong. Please try again." },
        });
    }
};

export const listOffer = async (req, res) => {
    try {
        const data = await Offer.findByIdAndUpdate(req.params.id, { isActive: true });
        return res.status(200).json({ success: true, message: "offer listed" });
    } catch (err) {
        console.error(err);
    }
};

export const unlistOffer = async (req, res) => {
    try {
        const data = await Offer.findByIdAndUpdate(req.params.id, { isActive: false });
        return res.status(200).json({ success: true, message: "offer unlisted" });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteOffer = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Offer.findByIdAndUpdate(id, { isDeleted: true });
        await removeOfferFromProducts(result._id);
        return res.status(success).json({ success: true, message: "offer deleted" });
    } catch (err) {
        console.error(err);
    }
};
