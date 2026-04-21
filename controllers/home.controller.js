import Category from "../models/category.model.js";
import Wishlist from "../models/wishlist.model.js";
import Cart from "../models/cart.model.js";
import { getFilterAndSortProducts, getPaginatedProducts, getProductById, getRelatedProducts, getSearchProductsByName, getWishlistProducts } from "../service/home.service.js";

export const loadCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true, isDeleted: false });
        if (req.user) {
            const wishlist = await Wishlist.findOne({ userId: req.user._id });
            const carts = await Cart.findOne({ userId: req.user._id });
            if (wishlist) {
                res.locals.totalWishlist = wishlist.products.length;
            }
            if (carts.length !== 0) {
                res.locals.totalCart = carts.items.length;
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

        if (req.xhr || req.headers.accept.includes("json")) {
            return res.json({ products, wishlist: userWishlist });
        }
        res.render("home", { products, userWishlist });
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
    return res.render("productDetails", { product, otherProducts, userWishlist });
};

export const getSearchProducts = async (req, res) => {
    const search = req.query.search;
    const { products, colors } = await getSearchProductsByName(search);
    const userWishlist = await getWishlistProducts(req.user?._id);
    return res.render("productSearch", { products, userWishlist, search, colors });
};

export const searchProductFilter = async (req, res) => {
    try {
        const [products, userWishlist] = await Promise.all([getFilterAndSortProducts(req.body), getWishlistProducts(req.user?._id)]);

        return res.json({ success: true, products, userWishlist });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
