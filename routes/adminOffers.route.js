import express from "express";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware.js";
import upload from "../lib/multer.js";
import { addNewOffers, deleteOffer, getOfferAddPage, getOffersEditPage, getOffersPage, listOffer, unlistOffer, updateOffersDetails } from "../controllers/adminOffers.controller.js";

const router = express.Router();

router.get("/", requireAdminAuth, getOffersPage);

router.get("/add", requireAdminAuth, getOfferAddPage);

router.post("/add", requireAdminAuth, upload.single("image"), addNewOffers);

router.get("/edit/:id", requireAdminAuth, getOffersEditPage);

router.put("/edit/:id", requireAdminAuth, upload.single("image"), updateOffersDetails);

router.patch("/list/:id", requireAdminAuth, listOffer);

router.patch("/unlist/:id", requireAdminAuth, unlistOffer);

router.delete("/delete/:id", requireAdminAuth, deleteOffer);

export default router;
