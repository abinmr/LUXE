const codeInput = document.getElementById("code");
const descriptionInput = document.getElementById("description");
const discountValueInput = document.getElementById("discount-value");
const minPurchaseInput = document.getElementById("min-purchase-amount");
const maxDiscountInput = document.getElementById("max-discount");
const usageLimitInput = document.getElementById("usage-limit");
const startDateInput = document.getElementById("start-date");
const expiryDateInput = document.getElementById("expiry-date");

const submitBtn = document.getElementById("coupon-btn");
const form = document.getElementById("coupon-form");

/**
 * @param {HTMLInputElement} inputEl
 * @param {HTMLParagraphElement} errorId
 * @param {string} message
 */
function validate(inputEl, errorId, message) {
    /** @type {HTMLParagraphElement} */
    const error = document.getElementById(errorId);
    const isEmpty = inputEl.value.trim().length === 0;
    if (isEmpty) {
        error.textContent = message;
        error.style.display = "block";
        return false;
    }
    error.textContent = "";
    error.style.display = "none";
    return true;
}

const fields = [
    { input: codeInput, errorId: "codeError", message: "Coupon code is required", event: "blur" },
    { input: descriptionInput, errorId: "descriptionError", message: "Description is required", event: "blur" },
    { input: discountValueInput, errorId: "discount-error", message: "Discount is required", event: "blur" },
    { input: minPurchaseInput, errorId: "min-purchase-error", message: "Min purchase amount is required", event: "blur" },
    { input: usageLimitInput, errorId: "usage-limit-error", message: "Limit is required", event: "blur" },
    { input: startDateInput, errorId: "start-date-error", message: "Start date is required", event: "click" },
    { input: expiryDateInput, errorId: "expiry-date-error", message: "Expiry date is required", event: "click" },
];

fields.forEach(({ input, errorId, message, event }) => {
    input.addEventListener(event, () => validate(input, errorId, message));
});

form.addEventListener("submit", (e) => {
    const results = fields.map(({ input, errorId, message }) => validate(input, errorId, message));
    const allValid = results.every(Boolean);
    if (!allValid) return e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Coupon...";
});
