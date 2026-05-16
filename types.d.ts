interface BaseOffer {
    _id: string;
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

type Offer = BaseOffer & OfferDetails & ApplicabilityDetails;
