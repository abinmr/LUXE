import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";
import Cart from "../models/cart.model.js";

export const checkUserStatus = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (user && !user.isBlocked) {
            // console.log("user mounted.");
            req.user = user;
            res.locals.user = user;
        } else {
            res.locals.user = null;
        }

        return next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.clearCookie("token");
        res.locals.user = null;
        return next();
    }
};

export const loadCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true, isDeleted: false });
        if (req.user) {
            const wishlist = await Wishlist.findOne({ userId: req.user._id });
            const carts = await Cart.aggregate([
                { $match: { userId: req.user._id } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $match: {
                        "product.isListed": true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: { $sum: "$items.quantity" },
                    },
                },
            ]);
            if (wishlist) {
                res.locals.totalWishlist = wishlist.products.length;
            }
            if (carts.length !== 0) {
                res.locals.totalCart = carts.reduce((acc, curr) => {
                    return (acc += curr.total);
                }, 0);
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
        let userWishlist = [];
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        const products = await Product.aggregate([
            {
                $match: {
                    isListed: true,
                    isDeleted: false,
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData",
                },
            },
            { $unwind: "$categoryData" },
            {
                $match: {
                    "categoryData.isActive": true,
                    "categoryData.isDeleted": false,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        let wishlist = null;
        if (req.user) {
            wishlist = await Wishlist.findOne({ userId: req.user._id });
        }
        if (wishlist) {
            userWishlist = wishlist.products.map((item) => item.productId.toString());
        }
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
    const product = await Product.findOne({ _id: id, isListed: true, isDeleted: false }).populate("category");
    if (!product.category.isActive) return res.redirect("/home");
    if (!product) {
        return res.redirect("/home");
    }
    const otherProducts = await Product.find({ _id: { $ne: id } }).limit(4);
    let userWishlist = [];
    let wishlist = null;
    if (req.user) {
        wishlist = await Wishlist.findOne({ userId: req.user._id });
    }
    if (wishlist) {
        userWishlist = wishlist.products.map((item) => item.productId.toString());
    }
    return res.render("productDetails", { product, otherProducts, userWishlist });
};

export const getSearchProducts = async (req, res) => {
    const search = req.query.search;
    const products = await Product.find({ name: { $regex: search, $options: "i" }, isListed: true, isDeleted: false });
    const colors = await Product.find({ name: { $regex: search, $options: "i" }, isListed: true, isDeleted: false }).distinct("variants.color");
    let userWishlist = [];
    let wishlist = null;
    if (req.user) {
        wishlist = await Wishlist.findOne({ userId: req.user._id });
    }
    if (wishlist) {
        userWishlist = wishlist.products.map((item) => item.productId.toString());
    }
    return res.render("productSearch", { products, userWishlist, search, colors });
};

export const searchProductFilter = async (req, res) => {
    try {
        const { search, priceRange, sizes, colors, sort } = req.body;

        const query = {
            name: { $regex: search || "", $options: "i" },
            isListed: true,
            isDeleted: false,
        };

        if (sizes && sizes.length > 0) {
            query["variants.sizes.size"] = { $in: sizes };
        }

        if (colors && colors.length > 0) {
            const regexColors = colors.map((color) => new RegExp(`^${color}$`, "i"));
            query["variants.color"] = { $in: regexColors };
        }

        if (priceRange) {
            query["variants.sizes.price"] = { $lte: parseInt(priceRange) };
        }

        let dbQuery = Product.find(query);

        if (sort === "low-to-high") {
            dbQuery = dbQuery.sort({ "variants.0.sizes.0.price": 1 });
        } else if (sort === "high-to-low") {
            dbQuery = dbQuery.sort({ "variants.0.sizes.0.price": -1 });
        } else if (sort === "A-Z") {
            dbQuery = dbQuery.sort({ name: 1 });
        } else if (sort === "Z-A") {
            dbQuery = dbQuery.sort({ name: -1 });
        } else {
            dbQuery = dbQuery.sort({ createdAt: 1 });
        }

        const products = await dbQuery.exec();

        let userWishlist = [];
        if (req.user) {
            const wishlist = await Wishlist.findOne({ userId: req.user._id });
            if (wishlist) {
                userWishlist = wishlist.products.map((item) => item.productId.toString());
            }
        }

        return res.json({ success: true, products, userWishlist });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
