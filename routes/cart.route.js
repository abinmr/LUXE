import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { addQuantity, addToCart, deleteCartItem, getCartDetails, getCartPage, minusQuantity, toggleSelection } from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/details", protectedRoute, getCartDetails);

router.get("/", protectedRoute, getCartPage);

router.post("/add", protectedRoute, addToCart);

router.get("/quantityAdd/:id", protectedRoute, addQuantity);

router.get("/quantityMinus/:id", protectedRoute, minusQuantity);

router.patch("/toggle-selection/:id", protectedRoute, toggleSelection);

router.delete("/delete/:id", protectedRoute, deleteCartItem);

export default router;
