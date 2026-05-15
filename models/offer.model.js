import mongoose from "mongoose";

const offerModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    offerType: {
        type: String,
        enum: ["percentage", "flat", "free-shipping"],
        required: true,
    },
    discountPercentage: {
        type: Number,
    },
    discountAmount: {
        type: Number,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    minPurchaseAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    maxDiscountAmount: {
        type: Number,
        required: true,
    },
    applicableTo: {
        type: String,
        enum: ["all", "category", "products"],
        required: true,
    },
    applicableCategories: [],
    applicableProducts: [],
    isActive: {
        type: Boolean,
        required: true,
    },
    featureHomepage: {
        type: Boolean,
        required: true,
    },
});

const Offer = mongoose.model("Offers", offerModel);

export default Offer;
