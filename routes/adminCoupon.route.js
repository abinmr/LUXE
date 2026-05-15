import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import Coupon from "../models/coupon.model.js";
import { serverError, success } from "../service/status.service.js";

const router = express.Router();

router.get("/", requireAdminAuth, async (req, res) => {
    try {
        const search = req.query.search;
        const couponStatus = req.query.couponStatus;
        console.log(couponStatus);

        let dbQuery = {};
        if (search) {
            dbQuery.$or = [{ code: { $regex: search, $options: "i" } }, { description: { $regex: description, $options: "i" } }];
        }
        const coupons = await Coupon.find(dbQuery);
        return res.render("coupons", { currentPage: "coupons", coupons });
    } catch (err) {
        console.error(err);
    }
});

router.get("/add", requireAdminAuth, (req, res) => {
    return res.render("couponsAdd");
});

router.post("/add", requireAdminAuth, async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { code, discountType, description, discountValue, minPurchaseAmount, maxDiscount, usageLimit, startDate, expiryDate } = req.body;

        if (!code || !discountType || !description || !discountValue || !minPurchaseAmount || !maxDiscount || !usageLimit || !startDate || !expiryDate) {
            return res.render("couponsAdd", { couponError: "Please provide all the fields" });
        }

        const isActive = req.body.isActive === "on";

        await Coupon.create({
            code: code,
            discountType: discountType,
            description: description,
            discountValue: discountValue,
            minPurchaseAmount: minPurchaseAmount,
            maxDiscountAmount: maxDiscount,
            usageLimit: usageLimit,
            startDate: startDate,
            expiryDate: expiryDate,
            users: [],
            isActive: isActive,
        });
        return res.redirect("/admin/coupons");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/coupons");
    }
});

router.patch("/status/unlist/:id", requireAdminAuth, async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
        return res.status(success).json({ success: true, message: "status updated" });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "error updating coupon" });
    }
});

router.patch("/status/list/:id", requireAdminAuth, async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.params.id, { isActive: true });
        return res.status(success).json({ success: true, message: "status updated" });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: "error updating coupon" });
    }
});

router.get("/edit/:id", requireAdminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        return res.render("couponsEdit", { coupon });
    } catch (err) {
        console.error(err);
    }
});

router.post("/edit/:id", requireAdminAuth, async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }

        const { code, discountType, description, discountValue, minPurchaseAmount, maxDiscount, usageLimit, startDate, expiryDate } = req.body;

        if (!code || !discountType || !description || !discountValue || !minPurchaseAmount || !maxDiscount || !usageLimit || !startDate || !expiryDate) {
            return res.render("couponsEdit", { couponError: "Please provide all the fields" });
        }

        await Coupon.updateOne(
            { _id: req.params.id },
            {
                code,
                discountType,
                description,
                discountValue,
                minPurchaseAmount,
                maxDiscountAmount: maxDiscount,
                usageLimit,
                startDate,
                expiryDate: expiryDate,
            },
        );
        return res.redirect("/admin/coupons");
    } catch (err) {
        console.error(err);
    }
});

export default router;
