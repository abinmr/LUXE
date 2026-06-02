export const CATEGORY_MESSAGE = {
    STATUS_UPDATE: "category status updated successfully",
    NOT_FOUND: "category not found",
    DELETE_SUCCESS: "category deleted successfully",
};

export const COUPON_MESSAGE = {
    LIST_SUCCESS: "coupon listed successfully",
    UNLIST_SUCCESS: "coupon unlisted successfully",
    ERROR_UPDATING: "error updating coupon",
    DELETE_SUCCESS: "coupon deleted successfully",
    INVALID_COUPON: "Not a valid coupon",
    USED_COUPON: "coupon already used before",
    LIMIT_EXCED: "coupon limit reached",
    EXPIRED: "coupon expired",
    MINIMUM_PURCHASE: (amount) => `Minium purchase of ₹${amount} required`,
    APPLIED: "coupon applied successfully",
    REMOVED: "coupon removed successfully",
};

export const CUSTOMER_MESSAGE = {
    BLOCK_SUCCESS: "user blocked successfully",
    UNBLOCK_SUCCESS: "user unblocked successfully",
};

export const OFFER_MESSAGE = {
    LIST_SUCCESS: "offer listed successfully",
    UNLIST_SUCCESS: "offer unlisted successfully",
    DELETE_SUCCESS: "offer deleted successfully",
};

export const ORDER_MESSAGE = {
    INVALID_ITEMS: "No items processed for return",
    CANCELLED_BEFORE: "Item already cancelled",
    CANCEL_SUCCESS: "Order cancelled successfully",
    EMPTY_CANCEL: "No items to cancel",
    ITEM_UNAVAILABLE: "Item not found",
    CANCEL_FAILED: "Failed to cancel order",
    NO_RETURN: "No items to return",
    RETURN_UNAVAILABLE: "Item cannot be returned",
    FAILED_RETURN_REQUEST: "Failed to request return",
};

export const PRODUCT_MESSAGE = {
    LIST_SUCCESS: "product listed successfully",
    UNLIST_SUCCESS: "product unlisted successfully",
    DELETE_SUCCESS: "offer deleted successfully",
    NOTFOUND: "Product not found",
    PRODUCT_UNAVAILABLE: "product no longer available",
    STOCK_UNAVAILABLE: "product no longer in stock",
};

export const PROFILE_MESSAGE = {
    UPDATED: "Profile updated successfully",
    UPDATE_FAIL: "Profile updated failed",
};

export const PASSWORD_MESSAGE = {
    WRONG: "Wrong password",
    UPDATED: "Password updated successfully",
    ERROR: "Error in changing password",
};

export const ADDRESS_MESSAGE = {
    CREATED: "Address created successfully",
    UPDATED: "Address updated successfully",
    UPDATE_FAIL: "Address failed to update",
    FAILED: "Failed to save address",
    SUCCESS: "Address saved successfully",
    FAILED_SAVE: "Address failed to save",
    DELETE_SUCCESS: "Address deleted successfully",
};

export const CART_MESSAGE = {
    ADDED_SUCCESS: "Added to cart",
};

export const WISHLIST_MESSAGE = {
    NO_PRODUCT: "product not found",
    PRODUCT_UNAVAILABLE: "product not longer available",
    ADDED: "Add to wishlist",
    ALREADY_AVAILABLE: "product already in wishlist",
    REMOVED: "Removed from wishlist",
};

export const SERVER_ERROR = "Internal server error";

export const CHECKOUT_MESSAGE = {
    REQUEST_ERROR: "error processing request",
    NO_PRODUCT: "select atleast 1 item to continue",
    SESSION_EXPIRED: "No active session available",
    PRODUCT_UNAVAILABLE: "Product no longer available",
    STOCK_UNAVAILABLE: (productName) => `Insufficient stock for ${productName}`,
    WALLET_BALANCE: "Insufficient wallet balance",
    ORDER_ISSUE: "Order cannot be retried",
    SIGNATURE_ERROR: "Invalid signature",
    PAYMENT_VERIFIED: "Payment verified successfully",
    PAYMENT_UNSUPPOTED: "Payment method not supported",
};
