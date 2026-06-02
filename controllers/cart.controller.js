import { addToCartService, calcPricing, changeQuantity, getCartItems, removeCartItem, toggleSelection } from "../service/cart.service.js";
import { serverError, success } from "../service/status.service.js";
import { CART_MESSAGE } from "../constants/messages.js";

export const getCartDetails = async (req, res) => {
    try {
        const cartItems = await getCartItems(req.user._id);
        const pricing = calcPricing(cartItems);
        return res.status(success).json({ success: true, data: pricing });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false });
    }
};

export const getCartPage = async (req, res) => {
    try {
        const cartItems = await getCartItems(req.user._id);
        const pricing = calcPricing(cartItems);
        return res.render("cart", { cartItems, pricing });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addToCart = async (req, res) => {
    try {
        const result = await addToCartService(req.user._id, req.body);
        return res.status(success).json({ success: true, message: CART_MESSAGE.ADDED_SUCCESS, totalCart: result.totalCart });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false, error: err.message });
    }
};

export const addQuantity = async (req, res) => {
    try {
        const total = await changeQuantity(req.user._id, req.params.id, 1);
        return res.status(success).json({ success: true, totalCart: total });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false });
    }
};

export const minusQuantity = async (req, res) => {
    try {
        const total = await changeQuantity(req.user._id, req.params.id, -1);
        return res.status(success).json({ success: true, totalCart: total });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false });
    }
};

export const toggleItemSelection = async (req, res) => {
    try {
        const { isSelected } = req.body;
        await toggleSelection(req.user._id, req.params.id, isSelected);
        return res.status(success).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const result = await removeCartItem(req.user._id, req.params.id);
        return res.status(success).json({ success: true, totalCart: result.totalCart });
    } catch (err) {
        console.error(err);
        return res.status(serverError).json({ success: false });
    }
};
