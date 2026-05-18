import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import upload from "../lib/multer.js";
import { addNewOffers, deleteOffer, getOfferAddPage, getOffersEditPage, getOffersPage, updateOffersDetails } from "../controllers/adminOffers.controller.js";
import Offer from "../models/offer.model.js";

const router = express.Router();

router.get("/", requireAdminAuth, getOffersPage);

router.get("/add", requireAdminAuth, getOfferAddPage);

router.post("/add", requireAdminAuth, upload.single("image"), addNewOffers);

router.get("/edit/:id", requireAdminAuth, getOffersEditPage);

router.post("/edit/:id", requireAdminAuth, upload.single("image"), updateOffersDetails);

router.patch("/deleted/:id", requireAdminAuth, deleteOffer);

router.patch("/list/:id", requireAdminAuth, async (req, res) => {
    try {
        const data = await Offer.findByIdAndUpdate(req.params.id, { isActive: true });
        return res.status(200).json({ success: true, message: "offer listed" });
    } catch (err) {
        console.error(err);
    }
});

router.patch("/unlist/:id", requireAdminAuth, async (req, res) => {
    try {
        const data = await Offer.findByIdAndUpdate(req.params.id, { isActive: false });
        return res.status(200).json({ success: true, message: "offer unlisted" });
    } catch (err) {
        console.error(err);
    }
});

export default router;
