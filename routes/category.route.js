import express from "express";
import { filterCategoryProducts, getCategoryProducts } from "../controllers/category.controller.js";

const router = express.Router();

router.get("/:id", getCategoryProducts);

router.post("/:id/filter", filterCategoryProducts);

export default router;
