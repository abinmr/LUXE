import { ObjectId } from "mongoose";

interface BaseOffer {
    _id: ObjectId;
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
    minPurchaseAmount: number;
    isActive: boolean;
    featureHomepage: boolean;
    isDeleted: boolean;
}

type OfferDetails = { offerType: "percentage"; discountPercentage: number; maxDiscountAmount: number } | { offerType: "flat"; discountAmount: number } | { offerType: "free-shipping" };

type ApplicabilityDetails = { applicableTo: "all" } | { applicableTo: "category"; applicableCategories: string[] } | { applicableTo: "products"; applicableProducts: string[] };

export type Offer = BaseOffer & OfferDetails & ApplicabilityDetails;

interface ReportData {
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalDiscount: number;
    netSale: number;
    orders: number;
}
