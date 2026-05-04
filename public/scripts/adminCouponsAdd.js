const codeInput = document.getElementById("code");
const descriptionInput = document.getElementById("description");
const discountValueInput = document.getElementById("discount-value");
const minPurchaseInput = document.getElementById("min-purchase-amount");
const maxDiscountInput = document.getElementById("max-discount");
const usageLimitInput = document.getElementById("usage-limit");

const submitBtn = document.getElementById("coupon-btn");
const form = document.getElementById("coupon-form");

function validateCode() {
    const codeError = document.getElementById("codeError");
    const code = codeInput.value.trim();
    if (code === "") {
        codeError.textContent = "coupon code is required";
        codeError.style.visibility = "visible";
        return false;
    }
    codeError.textContent = "";
    codeError.style.visibility = "hidden";
    return true;
}

function validateDescription() {
    const error = document.getElementById("descriptionError");
    const desc = descriptionInput.value.trim();
    if (desc === "") {
        error.textContent = "description is required";
        error.style.visibility = "visible";
        return false;
    }
    error.textContent = "";
    error.style.visibility = "hidden";
    return true;
}

function validateDiscountInput() {
    const error = document.getElementById("discount-error");
    const value = discountValueInput.value.length;
    if (value == 0) {
        error.textContent = "discount is required";
        error.style.visibility = "visible";
        return false;
    }
    error.textContent = "";
    error.style.visibility = "hidden";
    return true;
}

function validateMinPurchase() {
    const error = document.getElementById("min-purchase-error");
    const value = minPurchaseInput.value.length;
    if (value === 0) {
        error.textContent = "max discount amount is required";
        error.style.visibility = "visible";
        return false;
    }
    error.textContent = "";
    error.style.visibility = "hidden";
    return true;
}

function validateMaxDiscount() {
    const error = document.getElementById("max-discount-error");
    const value = maxDiscountInput.value.length;
    if (value === 0) {
        error.textContent = "min purchase amount is required";
        error.style.visibility = "visible";
        return false;
    }
    error.textContent = "";
    error.style.visibility = "hidden";
    return true;
}

function validateUsageLimit() {
    const error = document.getElementById("usage-limit-error");
    const value = usageLimitInput.value.length;
    if (value === 0) {
        error.textContent = "Limit is required";
        error.style.visibility = "visible";
        return false;
    }
    error.textContent = "";
    error.style.visibility = "hidden";
    return true;
}

codeInput.addEventListener("blur", validateCode);
descriptionInput.addEventListener("blur", validateDescription);
discountValueInput.addEventListener("blur", validateDiscountInput);
minPurchaseInput.addEventListener("blur", validateMinPurchase);
maxDiscountInput.addEventListener("blur", validateMaxDiscount);
usageLimitInput.addEventListener("blur", validateUsageLimit);

form.addEventListener("submit", (e) => {
    const isCodeValid = validateCode();
    const isDescValid = validateDescription();
    const isDiscountValid = validateDiscountInput();
    const isMinPurchaseValid = validateMinPurchase();
    const isMaxDiscountValid = validateMaxDiscount();
    const isUsageLimitValid = validateUsageLimit();
    if (!isCodeValid || !isDescValid || !isDiscountValid || !isMinPurchaseValid || !isMaxDiscountValid || !isUsageLimitValid) {
        return e.preventDefault();
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Coupon...";
});
