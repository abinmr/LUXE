import { COUPON_MESSAGE } from "../constants/messages.js";
import { couponUpdateById, createCoupon, getCouponById, getPaginatedCoupon, getTotalCoupons } from "../service/coupon.service.js";
import { serverError, success } from "../service/status.service.js";

export const getCouponPage = async (req, res) => {
    try {
        const search = req.query.search;
        const couponStatus = req.query.couponStatus;
        const page = parseInt(req.query.page) || 1;
        const limit = 7;
        const skip = (page - 1) * limit;
        let dbQuery = {
            isDeleted: false,
        };
        if (search) {
            dbQuery.$or = [{ code: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
        }

        if (couponStatus === "active") {
            dbQuery.isActive = true;
        } else if (couponStatus === "inactive") {
            dbQuery.isActive = false;
        }
        const coupons = await getPaginatedCoupon(dbQuery, skip, limit);
        const totalPages = await getTotalCoupons(dbQuery);
        return res.render("coupons", { currentPage: page, coupons, couponStatus, totalPages });
    } catch (err) {
        console.error(err);
    }
};

export const getCouponCreatePage = async (req, res) => {
    const oldData = {};
    return res.render("couponsAdd", { oldData });
};

export const createNewCoupon = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { code, discountType, description, discountValue, minPurchaseAmount, maxDiscount, usageLimit, startDate, expiryDate } = req.body;

        if (!code || !discountType || !description || !discountValue || !minPurchaseAmount || !maxDiscount || !usageLimit || !startDate || !expiryDate) {
            return res.render("couponsAdd", { couponError: "Please provide all the fields" });
        }

        const isActive = req.body.isActive === "on";

        const data = {
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
        };
        await createCoupon(data);
        return res.redirect("/admin/coupons");
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/coupons");
    }
};

export const unlistCoupon = async (req, res) => {
    try {
        await couponUpdateById(req.params.id, { isActive: false });
        return res.status(success).json({ success: true, message: COUPON_MESSAGE.UNLIST_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: COUPON_MESSAGE.ERROR_UPDATING });
    }
};

export const listCoupon = async (req, res) => {
    try {
        await couponUpdateById(req.params.id, { isActive: true });
        return res.status(success).json({ success: true, message: COUPON_MESSAGE.LIST_SUCCESS });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: COUPON_MESSAGE.ERROR_UPDATING });
    }
};

export const getEditCouponPage = async (req, res) => {
    try {
        const coupon = await getCouponById(req.params.id);
        return res.render("couponsEdit", { coupon });
    } catch (err) {
        console.error(err);
    }
};

export const updateCoupon = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }

        const { code, discountType, description, discountValue, minPurchaseAmount, maxDiscount, usageLimit, startDate, expiryDate } = req.body;

        if (!code || !discountType || !description || !discountValue || !minPurchaseAmount || !maxDiscount || !usageLimit || !startDate || !expiryDate) {
            return res.render("couponsEdit", { couponError: "Please provide all the fields" });
        }

        const data = {
            code,
            discountType,
            description,
            discountValue,
            minPurchaseAmount,
            maxDiscountAmount: maxDiscount,
            usageLimit,
            startDate,
            expiryDate: expiryDate,
        };
        await couponUpdateById(req.params.id, data);
        return res.redirect("/admin/coupons");
    } catch (err) {
        console.error(err);
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const result = await couponUpdateById(req.params.id, { isDeleted: true });
        return res.status(success).json({ success: true, message: COUPON_MESSAGE.DELETE_SUCCESS });
    } catch (err) {
        console.error(err);
    }
};
