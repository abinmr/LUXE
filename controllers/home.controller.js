import { getFilterAndSortProducts, getPaginatedProducts, getProductById, getRelatedProducts, getSearchProductsByName, getWishlistProducts } from "../service/home.service.js";
import { success } from "../service/status.service.js";
import { getUserWishlist } from "../service/wishlist.service.js";
import { getUserCart } from "../service/cart.service.js";
import { findOneOffer } from "../service/offer.service.js";
import { getAllActiveCategories } from "../service/adminCategory.service.js";
import { SERVER_ERROR } from "../constants/messages.js";

export const loadCategories = async (req, res, next) => {
    try {
        const categories = await getAllActiveCategories();
        if (req.user) {
            const wishlist = await getUserWishlist(req.user?._id);
            const carts = await getUserCart(req.user?._id);
            if (wishlist) {
                res.locals.totalWishlist = wishlist.products.length;
            }
            if (carts && carts.items) {
                const total = carts.items.reduce((acc, curr) => acc + curr.quantity, 0);
                res.locals.totalCart = total;
            }
        }
        res.locals.categories = categories;
        next();
    } catch (err) {
        next(err);
    }
};

export const getHomePage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;

        const [products, userWishlist] = await Promise.all([getPaginatedProducts(page), getWishlistProducts(req.user?._id)]);
        const offer = await findOneOffer({ isActive: true, isDeleted: false, featureHomepage: true });

        if (req.xhr || req.headers.accept?.includes("json")) {
            return res.json({ products, wishlist: userWishlist });
        }
        const toast = req.flash("home")[0];
        res.render("home", { products, userWishlist, offer, toast });
    } catch (err) {
        console.error(err);
        return res.render("home");
    }
};

export const getProductDetails = async (req, res) => {
    const id = req.params.id;
    const product = await getProductById(id);
    if (!product || !product.category.isActive) return res.redirect("/home");

    const [otherProducts, userWishlist] = await Promise.all([getRelatedProducts(id), getWishlistProducts(req.user?._id)]);
    const toast = req.flash("productDetails")[0];
    return res.render("productDetails", {
        product,
        otherProducts,
        userWishlist,
        toast: toast ? JSON.parse(toast) : null,
    });
};

export const getSearchProducts = async (req, res) => {
    const search = req.query.search;
    const { products, colors } = await getSearchProductsByName(search);
    const userWishlist = await getWishlistProducts(req.user?._id);

    const maxPrice = products.length > 0 ? Math.max(...products.flatMap((p) => p.variants.flatMap((v) => v.sizes.map((s) => s.price)))) : 500;
    return res.render("productSearch", {
        products,
        userWishlist,
        search,
        colors,
        maxPrice,
    });
};

export const searchProductFilter = async (req, res) => {
    try {
        const { search, priceRange, sort } = req.query;
        const sizes = req.query.sizes ? (Array.isArray(req.query.sizes) ? req.query.sizes : [req.query.sizes]) : [];
        const colors = req.query.colors ? (Array.isArray(req.query.colors) ? req.query.colors : [req.query.colors]) : [];

        const [products, userWishlist] = await Promise.all([getFilterAndSortProducts({ search, priceRange, sizes, colors, sort }), getWishlistProducts(req.user?._id)]);

        return res.status(success).json({ success: true, products, userWishlist });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: SERVER_ERROR });
    }
};
