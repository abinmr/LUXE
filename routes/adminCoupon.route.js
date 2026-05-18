import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import { createNewCoupon, getCouponPage, getEditCouponPage, listCoupon, unlistCoupon, updateCoupon } from "../controllers/adminCoupon.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getCouponPage);

router.get("/add", requireAdminAuth, (req, res) => {
    return res.render("couponsAdd");
});

router.post("/add", requireAdminAuth, createNewCoupon);

router.patch("/status/unlist/:id", requireAdminAuth, unlistCoupon);

router.patch("/status/list/:id", requireAdminAuth, listCoupon);

router.get("/edit/:id", requireAdminAuth, getEditCouponPage);

router.post("/edit/:id", requireAdminAuth, updateCoupon);

export default router;
