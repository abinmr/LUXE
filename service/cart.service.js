import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

export const getCartItems = async (userId) => {
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
                variantId: "$variant._id",
                sizeId: "$size._id",
                color: { $ifNull: ["$variant.color", ""] },
                productImage: { $ifNull: ["$variant.images", []] },
                size: { $ifNull: ["$size.size", ""] },
                stock: { $ifNull: ["$size.stock", 0] },
                price: { $ifNull: ["$size.price", 0] },
                compareAtPrice: { $ifNull: ["$size.compareAtPrice", 0] },
            },
        },
    ]);
};

export const calcPricing = (cartItems) => {
    const selectedItems = cartItems.filter((item) => item.isSelected && item.isListed);
    const subtotal = Math.floor(selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0));
    const gst = Math.round(subtotal * 0.05);
    const shipping = subtotal > 0 ? 40 : 0;
    const total = subtotal + gst + shipping;
    return { subtotal, gst, shipping, total };
};

export const addToCartService = async (userId, { productId, variantId, sizeId, quantity }) => {
    if (!productId || !variantId || !sizeId || !quantity) {
        throw new Error("Invalid product details");
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) throw new Error("Product not found");

    if (!product.isListed) throw new Error("Product no longer available");

    const variant = product.variants.find((v) => v._id.toString() === variantId);
    const size = variant.sizes.find((s) => s._id.toString() === sizeId);

    if (!size) throw new Error("Size not found");

    const availableStock = size.stock;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId && item.variantId.toString() === variantId && item.sizeId.toString() === sizeId);

    const requestedTotalQuantity = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (requestedTotalQuantity > availableStock) {
        const remaining = availableStock - (requestedTotalQuantity - 1);
        throw new Error(`Only ${remaining} left in stock.`);
    }
    if (existingItem) {
        existingItem.quantity += Number(quantity);
    } else {
        cart.items.push({ productId, variantId, sizeId, quantity });
    }

    const total = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);

    await cart.save();
    return { totalCart: total };
};

export const changeQuantity = async (userId, itemId, amount) => {
    return await Cart.updateOne({ userId, "items._id": itemId }, { $inc: { "items.$.quantity": amount } });
};

export const toggleSelection = async (userId, itemId, isSelected) => {
    return await Cart.updateOne({ userId: userId, "items._id": itemId }, { $set: { "items.$.isSelected": isSelected } });
};

export const removeCartItem = async (userId, itemId) => {
    const cart = await Cart.findOneAndUpdate({ userId: userId }, { $pull: { items: { _id: itemId } } }, { returnDocument: "after" });
    const total = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
    return { totalCart: total };
};
