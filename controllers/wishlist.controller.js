import { createWishlist, getUserWishlist, getWishlistDetails } from "../service/wishlist.service.js";
import { getProductById } from "../service/home.service.js";
import { badRequest, conflict, notFound, serverError, success } from "../service/status.service.js";
import { WISHLIST_MESSAGE } from "../constants/messages.js";

export const getWishlistProducts = async (req, res) => {
    try {
        const result = await getWishlistDetails(req.user?._id);
        const wishlist = result?.products.map((item) => item.productId);
        return res.render("wishlist", { wishlist });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const wishlist = await getUserWishlist(req.user?._id);
        const product = await getProductById(req.params.id);
        if (!product) {
            return res.status(notFound).json({ success: false, message: WISHLIST_MESSAGE.NO_PRODUCT });
        }
        if (!product.isListed) {
            req.flash("toast", JSON.stringify({ type: "error", message: WISHLIST_MESSAGE.PRODUCT_UNAVAILABLE }));
            return res.status(badRequest).json({ success: false, message: WISHLIST_MESSAGE.PRODUCT_UNAVAILABLE });
        }
        if (!wishlist) {
            const newWishlist = await createWishlist(req.user?._id, req.params.id);
            return res.status(success).json({ success: true, message: WISHLIST_MESSAGE.ADDED, totalWishlist: newWishlist.products.length });
        } else {
            const isAvailable = wishlist.products.some((p) => p.productId.toString() === req.params.id);
            if (!isAvailable) {
                wishlist.products.push({ productId: req.params.id });
                await wishlist.save();
            } else {
                return res.status(conflict).json({ success: false, message: WISHLIST_MESSAGE.ALREADY_AVAILABLE });
            }
        }
        return res.status(success).json({ success: true, message: WISHLIST_MESSAGE.ADDED, totalWishlist: wishlist.products.length });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, error: err });
    }
};

export const deleteWishlistProduct = async (req, res) => {
    try {
        const wishlist = await getUserWishlist(req.user?._id);
        let totalWishlist = 0;
        if (wishlist) {
            wishlist.products = wishlist.products.filter((p) => p.productId.toString() !== req.params.id);
            await wishlist.save();
            totalWishlist = wishlist.products.length;
        }
        return res.status(success).json({ success: true, message: WISHLIST_MESSAGE.REMOVED, totalWishlist });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: true, error: err });
    }
};
