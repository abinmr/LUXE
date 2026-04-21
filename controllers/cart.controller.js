import { addToCartService, calcPricing, changeQuantity, getCartItems, removeCartItem, toggleSelection } from "../service/cart.service.js";

export const getCartDetails = async (req, res) => {
    try {
        const cartItems = await getCartItems(req.user._id);
        const pricing = calcPricing(cartItems);
        return res.json({ success: true, data: pricing });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
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
        return res.status(200).json({ success: true, message: "Added to cart", totalCart: result.totalCart });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message });
    }
};

export const addQuantity = async (req, res) => {
    try {
        await changeQuantity(req.user._id, req.params.id, 1);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const minusQuantity = async (req, res) => {
    try {
        await changeQuantity(req.user._id, req.params.id, -1);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const toggleItemSelection = async (req, res) => {
    try {
        const { isSelected } = req.body;
        await toggleSelection(req.user._id, req.params.id, isSelected);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const result = await removeCartItem(req.user._id, req.params.id);
        return res.status(200).json({ success: true, totalCart: result.totalCart });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};
