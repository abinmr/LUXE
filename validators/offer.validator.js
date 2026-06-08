import z from "zod";

export const offerSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required"),
        description: z.string().trim().min(1, "Description is required"),
        offerType: z.enum(["percentage", "flat", "free-shipping"], { errorMap: () => ({ message: "Invalid offer type" }) }),
        discountPercentage: z
            .string()
            .optional()
            .transform((val) => (val ? Number(val) : undefined)),
        discountAmount: z
            .string()
            .optional()
            .transform((val) => (val ? Number(val) : undefined)),
        startDate: z.string(),
        endDate: z.string(),
        minPurchaseAmount: z.string().transform((val) => Number(val)),
        maxDiscountAmount: z.string().transform((val) => Number(val)),
        applicableTo: z.enum(["all", "category", "products"]),
        applicableCategories: z.preprocess((val) => {
            if (!val) return [];
            return Array.isArray(val) ? val : [val];
        }, z.array(z.string()).optional()),
        applicableProducts: z.preprocess((val) => {
            if (!val) return [];
            return Array.isArray(val) ? val : [val];
        }, z.array(z.string()).optional()),
        isActive: z
            .string()
            .transform((val) => val === "on")
            .default(false),
        featureHomepage: z
            .string()
            .optional()
            .transform((val) => val === "on")
            .default(false),
    })
    .superRefine((data, ctx) => {
        if (data.offerType === "percentage") {
            if (!data.discountPercentage) {
                ctx.addIssue({
                    path: ["discountPercentage"],
                    code: z.ZodIssueCode.custom,
                    message: "Discount percentage is required",
                });
            }
            if (data.discountPercentage && (data.discountPercentage < 1 || data.discountPercentage > 100)) {
                ctx.addIssue({
                    path: ["discountPercentage"],
                    code: z.ZodIssueCode.custom,
                    message: "Discount percentage must be between 1 and 100",
                });
            }
        }
        if (data.offerType === "flat") {
            if (!data.discountAmount) {
                ctx.addIssue({
                    path: ["discountAmount"],
                    code: z.ZodIssueCode.custom,
                    message: "Discount amount is required",
                });
            }
        }

        if (new Date(data.endDate) <= new Date(data.startDate)) {
            ctx.addIssue({
                path: ["endDate"],
                code: z.ZodIssueCode.custom,
                message: "End date must be after start date",
            });
        }
        if (data.minPurchaseAmount < 0) {
            ctx.addIssue({
                path: ["minPurchaseAmount"],
                code: z.ZodIssueCode.custom,
                message: "Min purchase amount cannot be negative",
            });
        }

        if (data.maxDiscountAmount > data.minPurchaseAmount) {
            ctx.addIssue({
                path: ["maxDiscountAmount"],
                code: z.ZodIssueCode.custom,
                message: "Max discount cannot be greater than min purchase amount",
            });
        }

        if (data.applicableTo === "category" && (!data.applicableCategories || data.applicableCategories.length === 0)) {
            ctx.addIssue({
                path: ["applicableCategories"],
                code: z.ZodIssueCode.custom,
                message: "At least one category is required",
            });
        }
        if (data.applicableTo === "products" && (!data.applicableProducts || data.applicableProducts.length === 0)) {
            ctx.addIssue({
                path: ["applicableProducts"],
                code: z.ZodIssueCode.custom,
                message: "At least one product is required",
            });
        }
    });
