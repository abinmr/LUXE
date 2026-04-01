import express from "express";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true, isDeleted: false });
        const products = await Product.find({ category: req.params.id, isListed: true, isDeleted: false });
        return res.render("categoryDetails", { categories, id: req.params.id, products });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
});

console.log("router hit");

export default router;
