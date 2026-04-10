import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";

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

export const getHomePage = async (req, res) => {
    try {
        let userWishlist = [];
        const categories = await Category.find({ $and: [{ isActive: true, isDeleted: false }] });
        // const products = await Product.find({ isDeleted: false, isListed: true })
        //     .populate({ path: "category", match: { isListed: true } })
        //     .limit(12);
        const products = await Product.aggregate([
            {
                $lookup: {
                    from: "categories",
                    let: { categoryId: "$category" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$categoryId"] },
                            },
                        },
                        {
                            $match: {
                                isActive: true,
                            },
                        },
                    ],
                    as: "category",
                },
            },
            {
                $match: {
                    category: { $ne: [] },
                },
            },
        ]);
        let wishlist = null;
        if (req.user) {
            wishlist = await Wishlist.findOne({ userId: req.user._id });
        }
        if (wishlist) {
            userWishlist = wishlist.products.map((item) => item.productId.toString());
        }
        return res.render("home", { categories, products, userWishlist });
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
    const categories = await Category.find({ isActive: true, isDeleted: false });
    const otherProducts = await Product.find({ _id: { $ne: id } }).limit(4);
    let userWishlist = [];
    let wishlist = null;
    if (req.user) {
        wishlist = await Wishlist.findOne({ userId: req.user._id });
    }
    if (wishlist) {
        userWishlist = wishlist.products.map((item) => item.productId.toString());
    }
    return res.render("productDetails", { categories, product, otherProducts, userWishlist });
};

export const getSearchProducts = async (req, res) => {
    const search = req.query.search;
    const categories = await Category.find({ isActive: true, isDeleted: false });
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
    return res.render("productSearch", { categories, products, userWishlist, search, colors });
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
