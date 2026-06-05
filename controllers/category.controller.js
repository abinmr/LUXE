import { getAllActiveCategories } from "../service/adminCategory.service.js";
import { getCategoryColors, getProducts } from "../service/product.service.js";
import { serverError, success } from "../service/status.service.js";
import { getUserWishlist } from "../service/wishlist.service.js";
import { SERVER_ERROR } from "../constants/messages.js";

export const getCategoryProducts = async (req, res) => {
    try {
        let userWishlist = [];
        const categories = await getAllActiveCategories();
        const products = await getProducts({ category: req.params.id, isListed: true, isDeleted: false });
        const colors = await getCategoryColors(req.params.id);
        let wishlist = null;
        if (req.user) {
            wishlist = await getUserWishlist(req.user?._id);
        }
        if (wishlist) {
            userWishlist = wishlist.products.map((item) => item.productId.toString());
        }
        const maxPrice = products.length > 0 ? Math.max(...products.flatMap((p) => p.variants.flatMap((v) => v.sizes.map((s) => s.price)))) : 500;
        return res.render("categoryDetails", { categories, id: req.params.id, products, userWishlist, colors, maxPrice });
    } catch (err) {
        console.error("category error", err);
        return res.redirect("/home");
    }
};

export const filterCategoryProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { priceRange, sizes, colors, sort } = req.query;

        const query = {
            category: id,
            isListed: true,
            isDeleted: false,
        };

        if (sizes && sizes.length > 0) {
            query["variants.sizes.size"] = { $in: sizes };
        }

        if (colors && colors.length > 0) {
            query["variants.color"] = { $in: colors };
        }

        if (priceRange) {
            query["variants.sizes.price"] = { $lte: parseInt(priceRange) };
        }

        let sortOption = { createdAt: 1 };
        if (sort === "low-to-high") {
            sortOption = { "variants.0.sizes.0.price": 1 };
        } else if (sort === "high-to-low") {
            sortOption = { "variants.0.sizes.0.price": -1 };
        } else if (sort === "A-Z") {
            sortOption = { name: 1 };
        } else if (sort === "Z-A") {
            sortOption = { name: -1 };
        }

        const products = await getProducts(query, { sort: sortOption });

        let userWishlist = [];
        if (req.user) {
            const wishlist = await getUserWishlist(req.user?._id);
            if (wishlist) {
                userWishlist = wishlist.products.map((item) => item.productId.toString());
            }
        }

        return res.status(success).json({ success: true, products, userWishlist });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, message: SERVER_ERROR });
    }
};
