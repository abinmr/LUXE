import Cart from "../models/cart.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

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
        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category",
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
                categoryActive: { $arrayElemAt: ["$category.isActive", 0] },
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
                categoryActive: 1,
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
    const selectedItems = cartItems.filter((item) => item.isSelected && item.isListed);
    const subtotal = Math.floor(selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0));
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
        const cartItems = await getCartItems(req.user._id);
        const pricing = calcPricing(cartItems);
        // const total = await Cart.aggregate([{ $addFields: { total: { $sum: "$items.quantity" } } }]);
        // console.log(JSON.stringify(total, null, 2));
        return res.render("cart", { cartItems, pricing });
    } catch (err) {
        console.error(err);
        return res.redirect("/home");
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, variantId, sizeId, quantity } = req.body;
        if (!productId || !variantId || !sizeId || !quantity) {
            return res.status(400).json({ success: false, error: "Invalid product details" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ success: false, error: "product not found" });
        }

        if (!product.isListed) {
            return res.status(400).json({ success: false, error: "product no longer available" });
        }

        const variant = product.variants.find((v) => v._id.toString() === variantId);
        const size = variant.sizes.find((s) => s._id.toString() === sizeId);

        if (!size) {
            return res.status(400).json({ success: true, error: "size not found" });
        }

        const availableStock = size.stock;

        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }

        const existingItem = cart.items.find((item) => item.productId.toString() === productId && item.variantId.toString() === variantId && item.sizeId.toString() === sizeId);

        const requestedTotalQuantity = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

        if (requestedTotalQuantity > availableStock) {
            const remaining = availableStock - (requestedTotalQuantity - 1);
            return res.status(400).json({ error: `cannot add! ${remaining} left` });
        }
        if (existingItem) {
            existingItem.quantity += Number(quantity);
        } else {
            cart.items.push({ productId, variantId, sizeId, quantity });
        }

        await cart.save();
        return res.status(200).json({ success: true, message: "Added to cart" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Server error" });
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
