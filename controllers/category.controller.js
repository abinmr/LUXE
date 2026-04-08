import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Wishlist from "../models/wishlist.model.js";

export const getCategoryProducts = async (req, res) => {
    try {
        let userWishlist = [];
        const categories = await Category.find({ isActive: true, isDeleted: false });
        const products = await Product.find({ category: req.params.id, isListed: true, isDeleted: false });
        // const colors = await Product.distinct("variants.color");
        const colors = await Product.find({ category: req.params.id, isListed: true, isDeleted: false }).distinct("variants.color");
        let wishlist = null;
        if (req.user) {
            wishlist = await Wishlist.findOne({ userId: req.user._id });
        }
        if (wishlist) {
            userWishlist = wishlist.products.map((item) => item.productId.toString());
        }
        // console.log("Products", JSON.stringify(products, null, 2));
        return res.render("categoryDetails", { categories, id: req.params.id, products, userWishlist, colors });
    } catch (err) {
        console.error("category error", err);
        return res.redirect("/home");
    }
};

export const filterCategoryProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { priceRange, sizes, colors, sort } = req.body;

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
