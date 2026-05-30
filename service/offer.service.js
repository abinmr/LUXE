import Offer from "../models/offer.model.js";
import Product from "../models/product.model.js";
import nodeCron from "node-cron";

/** @typedef {import('../types.d.ts').Offer} Offer */
/** @typedef {import("mongoose").ObjectId} ObjectId */

/**
 * @param {Offer} query -
 * @returns {Promise<Offer[]>} -
 */
export async function getOffers(query) {
    return await Offer.find(query);
}

/**
 * @param {ObjectId} id -
 */
export async function findOfferById(id) {
    return await Offer.findById(id);
}

/**
 * @param {Offer} query -
 */
export async function findOneOffer(query) {
    return await Offer.findOne(query);
}

/**
 * @param {Offer} data -
 */
export async function createOffer(data) {
    return await Offer.create(data);
}

/**
 * @param {ObjectId} id -
 * @param {Offer} data -
 */
export async function updateOffer(id, data) {
    return await Offer.findByIdAndUpdate(id, data, { returnDocument: "after" });
}

/**
 * @param {Offer} offer
 */
export async function applyOffersToProducts(offer) {
    let matchQuery = { isDeleted: false };

    if (offer.applicableTo === "category") {
        matchQuery.category = { $in: offer.applicableCategories };
    } else if (offer.applicableTo === "products") {
        matchQuery._id = { $in: offer.applicableProducts };
    }

    const products = await Product.find(matchQuery);

    for (const product of products) {
        let modified = false;
        for (const variant of product.variants) {
            for (const size of variant.sizes) {
                const basePrice = size.price;
                let discountPrice = basePrice;
                if (offer.offerType === "percentage") {
                    const discount = Math.min((basePrice * offer.discountPercentage) / 100, offer.maxDiscountAmount);
                    discountPrice = Math.round(basePrice - discount);
                } else if (offer.offerType === "flat") {
                    discountPrice = Math.max(0, Math.round(basePrice - offer.discountAmount));
                }
                if (!size.effectivePrice || discountPrice < size.effectivePrice) {
                    size.effectivePrice = discountPrice;
                    size.appliedOfferId = offer._id;
                    modified = true;
                }
            }
        }
        if (modified) await product.save();
    }
}

/**
 * @param {ObjectId} offerId
 */
export async function removeOfferFromProducts(offerId) {
    const products = await Product.find({ "variants.sizes.appliedOfferId": offerId });

    for (const product of products) {
        for (const variant of product.variants) {
            for (const size of variant.sizes) {
                if (size.appliedOfferId?.toString() === offerId.toString()) {
                    size.effectivePrice = undefined;
                    size.appliedOfferId = undefined;
                }
            }
        }
        await product.save();
    }
}

export async function deleteOfferById(id) {
    return await Offer.findByIdAndUpdate(id, { isDeleted: true });
}

nodeCron.schedule("0 * * * *", async () => {
    const now = new Date();
    const expiredOffer = await Offer.find({ isActive: true, endDate: { $lt: now } });
    for (const offer of expiredOffer) {
        await removeOfferFromProducts(offer._id);
        offer.isActive = false;
        await offer.save();
    }
});
