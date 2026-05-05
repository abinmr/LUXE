import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import {
    applyCoupon,
    checkoutAddAddress,
    checkoutBuyNow,
    checkoutFailurePage,
    checkoutPlaceOrder,
    getCheckoutPage,
    getCheckoutSuccessPage,
    getDefaultAddress,
} from "../controllers/checkout.controller.js";

const router = express.Router();

router.use(getDefaultAddress);

router.post("/add-address", protectedRoute, checkoutAddAddress);

router.post("/", protectedRoute, getCheckoutPage);

router.post("/buy-now", protectedRoute, checkoutBuyNow);

router.post("/apply-coupon", protectedRoute, applyCoupon);

router.post("/place-order", protectedRoute, checkoutPlaceOrder);

router.get("/success", protectedRoute, getCheckoutSuccessPage);

router.get("/failure", protectedRoute, checkoutFailurePage);

export default router;
