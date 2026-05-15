import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { getAllCategories } from "../service/adminCategory.service.js";
import upload from "../lib/multer.js";
import { offerSchema } from "../validators/offer.validator.js";
import { getAllProducts } from "../service/product.service.js";
import Offer from "../models/offer.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    const offers = await Offer.find();
    console.log(offers);

    return res.render("offers", { currentPage: "offers", offers });
});

router.get("/add", requireAdminAuth, async (req, res) => {
    const categories = await getAllCategories();
    const products = await getAllProducts();
    const offerError = req.flash("offerError")[0];
    const offerImageError = req.flash("offerImageError")[0];
    return res.render("offerAdd", { categories, products, offerError, offerImageError, errors: {}, oldData: {} });
});

router.post("/add", requireAdminAuth, upload.single("image"), async (req, res) => {
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
        const { title, ...rest } = validateData.data;

        if (rest.applicableTo === "category") delete rest.applicableProducts;
        else if (rest.applicableTo === "products") delete rest.applicableCategories;
        else {
            delete rest.applicableCategories;
            delete rest.applicableProducts;
        }

        const result = await Offer.create({ ...rest, titel: title });
        console.log("result", result);
        return res.redirect("/admin/offers");
    } catch (error) {
        console.error(error);
        return res.render("offerAdd", {
            errors: { general: "Something went wrong. Please try again." },
            oldData: req.body,
            products,
            categories,
        });
    }
});

export default router;
