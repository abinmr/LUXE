import express from "express";
import Wishlist from "../models/wishlist.model.js";
import Category from "../models/category.model.js";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addToWishlist, deleteWishlistProduct, getWishlistProducts } from "../controllers/wishlist.controller.js";

const router = express.Router();

router.get("/", protectedRoute, getWishlistProducts);

router.get("/add/:id", protectedRoute, addToWishlist);

router.delete("/delete/:id", protectedRoute, deleteWishlistProduct);

export default router;
