import Cart from "../models/cart.model.js";
import Category from "../models/category.model.js";

async function getCartItems(userId) {
    return Cart.aggregate([
        { $match: { userId } },
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
            $addFields: {
                itemId: "$items._id",
                quantity: "$items.quantity",
                sizeId: "$items.sizeId",
                isSelected: "$items.isSelected",
                productId: "$product._id",
                productName: "$product.name",
                description: "$product.description",
                isListed: "$product.isListed",
                variant: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$product.variants",
                                as: "v",
                                cond: { $eq: ["$$v._id", { $toObjectId: "$items.variantId" }] },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $addFields: {
                size: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$variant.sizes",
                                as: "s",
                                cond: { $eq: ["$$s._id", { $toObjectId: "$sizeId" }] },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $project: {
                _id: 0,
                itemId: 1,
                productId: 1,
                productName: 1,
                description: 1,
                quantity: 1,
                isSelected: 1,
                isListed: 1,
                color: { $ifNull: ["$variant.color", ""] },
                images: { $ifNull: ["$variant.images", []] },
                size: { $ifNull: ["$size.size", ""] },
                stock: { $ifNull: ["$size.stock", 0] },
                price: { $ifNull: ["$size.price", 0] },
                compareAtPrice: { $ifNull: ["$size.compareAtPrice", 0] },
            },
        },
    ]);
}

function calcPricing(cartItems) {
    const selectedItems = cartItems.filter((item) => item.isSelected);
    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const shipping = subtotal > 0 ? 40 : 0;
    const total = subtotal + gst + shipping;
    return { subtotal, gst, shipping, total };
}

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
        const categories = await Category.find({ isActive: true, isDeleted: false });
        const cartItems = await getCartItems(req.user._id);
        const pricing = calcPricing(cartItems);
        console.log("pricing", cartItems);
        return res.render("cart", { categories, cartItems, pricing });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, variantId, sizeId, quantity } = req.body;
        if (!productId || !variantId || !sizeId || !quantity) {
            req.flash("toast", JSON.stringify({ type: "error", message: "Invalid product details" }));
            return res.redirect("/home");
        }

        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }

        const existingItem = cart.items.find((item) => item.productId.toString() === productId && item.variantId.toString() === variantId && item.sizeId.toString() === sizeId);

        if (existingItem) {
            existingItem.quantity += Number(quantity);
        } else {
            cart.items.push({ productId, variantId, sizeId, quantity });
        }

        await cart.save();
        req.flash("toast", JSON.stringify({ type: "success", message: "Added to cart!" }));
        return res.redirect("/cart");
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addQuantity = async (req, res) => {
    try {
        await Cart.updateOne({ userId: req.user._id, "items._id": req.params.id }, { $inc: { "items.$.quantity": 1 } });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const minusQuantity = async (req, res) => {
    try {
        await Cart.updateOne({ userId: req.user._id, "items._id": req.params.id }, { $inc: { "items.$.quantity": -1 } });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const toggleSelection = async (req, res) => {
    try {
        const { isSelected } = req.body;
        await Cart.updateOne({ userId: req.user._id, "items._id": req.params.id }, { $set: { "items.$.isSelected": isSelected } });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        await Cart.updateOne({ userId: req.user._id }, { $pull: { items: { _id: req.params.id } } });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};
