import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";

export const getWishlistProducts = async (req, res) => {
    try {
        const result = await Wishlist.find({ userId: req.user._id }).populate({
            path: "products.productId",
            populate: {
                path: "category",
                model: "Category",
            },
        });
        const wishlist = result[0].products.map((item) => item.productId);
        res.render("wishlist", { wishlist });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "product not found" });
        }
        if (!product.isListed) {
            req.flash("toast", JSON.stringify({ type: "error", message: "product not longer available" }));
            return res.status(400).json({ success: false, message: "product not longer available" });
        }
        if (!wishlist) {
            await Wishlist.create({ userId: req.user._id, products: [{ productId: req.params.id }] });
        } else {
            const isAvailable = wishlist.products.some((p) => p.productId.toString() === req.params.id);
            if (!isAvailable) {
                wishlist.products.push({ productId: req.params.id });
                await wishlist.save();
            } else {
                console.log("already in wishlist");
                return res.status(409).json({ success: false, message: "product already in wishlist" });
            }
        }
        req.flash("toast", JSON.stringify({ type: "success", message: "Added to wishlist" }));
        return res.status(200).json({ success: true, message: "Add to wishlist" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err });
    }
};

export const deleteWishlistProduct = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (wishlist) {
            wishlist.products = wishlist.products.filter((p) => p.productId.toString() !== req.params.id);
            wishlist.save();
        }
        return res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: true, error: err });
    }
};
