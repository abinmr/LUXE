import express from "express";
import { checkUserStatus, getHomePage, getProductDetails, getSearchProducts, loadCategories, searchProductFilter } from "../controllers/home.controller.js";

const router = express.Router();

router.use(checkUserStatus);

router.use(loadCategories);

router.get("/home", getHomePage);

router.get("/product/:id", getProductDetails);

router.get("/search", getSearchProducts);

router.post("/search/filter", searchProductFilter);

export default router;
