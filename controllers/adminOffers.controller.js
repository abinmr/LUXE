import fs from "fs";
import { getAllCategories } from "../service/adminCategory.service.js";
import { offerSchema } from "../validators/offer.validator.js";
import { getAllProducts } from "../service/product.service.js";
import cloudinary from "../lib/cloudinary.js";
import { applyOffersToProducts, createOffer, deleteOfferById, findOfferById, findOneOffer, getOffers, removeOfferFromProducts, updateOffer } from "../service/offer.service.js";
import { success, serverError } from "../service/status.service.js";
import Product from "../models/product.model.js";

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

/**
 * @param {Request} req -
 * @param {Response} res -
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
        const offers = await getOffers(dbQuery);
        return res.render("offers", { currentPage: "offers", offers, search });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const getOfferAddPage = async (req, res) => {
    const categories = await getAllCategories();
    const products = await getAllProducts();
    const offerError = req.flash("offerError")[0];
    const offerImageError = req.flash("offerImageError")[0];
    return res.render("offerAdd", { categories, products, offerError, offerImageError, errors: {}, oldData: {} });
};

/**
 * @param {Request} req -
 * @param {Response} res -
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
            const anyActiveOffer = await findOneOffer({ applicableTo: "all", isDeleted: false });
            if (anyActiveOffer) {
                return res.render("offerAdd", { errors: {}, offerError: "Their is already an offer available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "category") {
            const hasOffers = await Product.exists({ category: { $in: data.applicableCategories }, "variants.sizes.appliedOfferId": { $exists: true, $ne: null } });
            console.log(hasOffers);
            if (hasOffers) {
                console.log("Has offers");
                return res.render("offerAdd", {
                    errors: {},
                    offerError: "One or more products in these categories already have an offer active.",
                    oldData: req.body,
                    products,
                    categories,
                });
            }
            // const anyActiveOffer = await findOneOffer({ applicableTo: "category", applicableCategories: { $in: data.applicableCategories }, isDeleted: false });
            // if (anyActiveOffer) {
            //     return res.render("offerAdd", { errors: {}, offerError: "Offer for these categories is already available", oldData: req.body, products, categories });
            // }
        } else if (data.applicableTo === "products") {
            const anyActiveOffer = await findOneOffer({ applicableTo: "products", applicableProducts: { $in: data.applicableProducts }, isDeleted: false });
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

        const result = await createOffer({ ...data, image: uploadResult.secure_url });
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
 * @param {Request} req -
 * @param {Response} res -
 */
export const getOffersEditPage = async (req, res) => {
    try {
        const id = req.params.id;
        const offers = await findOfferById(id);
        const categories = await getAllCategories();
        const products = await getAllProducts();
        const errors = {};
        return res.render("offersEdit", { offers, categories, products, errors });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const updateOffersDetails = async (req, res) => {
    const id = req.params.id;
    const categories = await getAllCategories();
    const products = await getAllProducts();
    const offers = await findOfferById(id);

    const validateData = offerSchema.safeParse({ ...req.body });

    if (!validateData.success) {
        const errors = {};
        validateData.error.issues.forEach((err) => {
            errors[err.path[0]] = err.message;
        });
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

        const updatePayload = { ...data };
        /** @type {import("../types.js").Offer} */
        const unsetPayload = {};

        if (data.applicableTo === "all") {
            const anyActiveOffer = await findOneOffer({ _id: { $ne: id }, applicableTo: "all", isDeleted: false });
            unsetPayload.applicableCategories = "";
            unsetPayload.applicableProducts = "";
            if (anyActiveOffer) {
                return res.render("offersEdit", { offers, errors: {}, offerError: "Their is already an offer available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "category") {
            const anyActiveOffer = await findOneOffer({ _id: { $ne: id }, applicableTo: "category", applicableCategories: { $in: data.applicableCategories }, isDeleted: false });
            unsetPayload.applicableProducts = "";
            if (anyActiveOffer) {
                return res.render("offersEdit", { offers, errors: {}, offerError: "Offer for these categories is already available", oldData: req.body, products, categories });
            }
        } else if (data.applicableTo === "products") {
            const anyActiveOffer = await findOneOffer({ _id: { $ne: id }, applicableTo: "products", applicableProducts: { $in: data.applicableProducts }, isDeleted: false });
            unsetPayload.applicableCategories = "";
            if (anyActiveOffer) {
                return res.render("offersEdit", { offers, errors: {}, offerError: "Offer for these products are already available", oldData: req.body, products, categories });
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
        const result = await updateOffer(id, { $set: updatePayload, $unset: unsetPayload });
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
        const offers = await findOfferById(req.params.id);
        return res.render("offersEdit", {
            offers,
            categories,
            products,
            errors: { general: "Something went wrong. Please try again." },
        });
    }
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const listOffer = async (req, res) => {
    try {
        const result = await updateOffer(req.params.id, { isActive: true });
        await applyOffersToProducts(result._id);
        return res.status(200).json({ success: true, message: "offer listed" });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const unlistOffer = async (req, res) => {
    try {
        const result = await updateOffer(req.params.id, { isActive: false });
        await removeOfferFromProducts(result._id);
        return res.status(success).json({ success: true, message: "offer unlisted" });
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {Request} req -
 * @param {Response} res -
 */
export const deleteOffer = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await deleteOfferById(id);
        await removeOfferFromProducts(result._id);
        return res.status(success).json({ success: true, message: "offer deleted" });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "Something went wrong" });
    }
};
