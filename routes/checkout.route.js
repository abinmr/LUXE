import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";
import { applyCoupon, checkoutAddAddress, checkoutBuyNow, checkoutFailurePage, checkoutPlaceOrder, getCheckoutPage, getCheckoutSuccessPage, getDefaultAddress, removeCoupon, retryPayment, verifyPayment } from "../controllers/checkout.controller.js";

const router = express.Router();

router.use(getDefaultAddress);

router.post("/add-address", protectedRoute, checkoutAddAddress);

router.post("/", protectedRoute, getCheckoutPage);

router.post("/buy-now", protectedRoute, checkoutBuyNow);

router.post("/apply-coupon", protectedRoute, applyCoupon);

router.patch("/remove-coupon", protectedRoute, removeCoupon);

router.post("/place-order", protectedRoute, checkoutPlaceOrder);

router.get("/success", protectedRoute, getCheckoutSuccessPage);

router.get("/failure", protectedRoute, checkoutFailurePage);

router.post("/verify-payment", protectedRoute, verifyPayment);

router.get("/retry-payment/:id", protectedRoute, retryPayment);

export default router;
