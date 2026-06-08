document.addEventListener("DOMContentLoaded", () => {
    const codeInput = document.getElementById("code");
    const descriptionInput = document.getElementById("description");
    const discountPercentageInput = document.getElementById("discount-value-percentage");
    const discountFixedInput = document.getElementById("discount-value-fixed");
    const minPurchaseInput = document.getElementById("min-purchase-amount");
    const maxDiscountInput = document.getElementById("max-discount");
    const usageLimitInput = document.getElementById("usage-limit");
    const startDateInput = document.getElementById("start-date");
    const expiryDateInput = document.getElementById("expiry-date");

    const discountTypeSelect = document.getElementById("discount-type");
    const discountPercentageContainer = document.getElementById("discount-percentage-container");
    const discountFixedContainer = document.getElementById("discount-fixed-container");
    const maxDiscountContainer = document.getElementById("max-discount-container");

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
        if (!error) return true;

        const valueStr = inputEl.value.trim();
        if (valueStr.length === 0) {
            error.textContent = message;
            error.style.display = "block";
            return false;
        }

        const num = Number(valueStr);
        if (inputEl === discountPercentageInput || inputEl === discountFixedInput || inputEl === minPurchaseInput || inputEl === maxDiscountInput || inputEl === usageLimitInput) {
            if (isNaN(num) || num < 0) {
                error.textContent = "Value must be 0 or greater";
                error.style.display = "block";
                return false;
            }
        }

        if (inputEl === discountPercentageInput) {
            if (num < 1 || num > 99) {
                error.textContent = "Discount percentage must be between 1 and 100";
                error.style.display = "block";
                return false;
            }
        }

        if (inputEl === discountFixedInput) {
            if (num < 1) {
                error.textContent = "Discount amount must be at least 1";
                error.style.display = "block";
                return false;
            }
            const minPurchaseVal = Number(minPurchaseInput.value);
            if (!isNaN(minPurchaseVal) && num > minPurchaseVal) {
                error.textContent = "Discount cannot exceed minimum purchase amount";
                error.style.display = "block";
                return false;
            }
        }

        error.textContent = "";
        error.style.display = "none";
        return true;
    }

    const fields = [
        { input: codeInput, errorId: "codeError", message: "Coupon code is required", event: "blur" },
        { input: descriptionInput, errorId: "descriptionError", message: "Description is required", event: "blur" },
        { input: discountTypeSelect, errorId: "discount-type-error", message: "coupon discount type is required", event: "change" },
        { input: discountPercentageInput, errorId: "discount-percentage-error", message: "Discount percentage is required", event: "blur" },
        { input: discountFixedInput, errorId: "discount-fixed-error", message: "Discount amount is required", event: "blur" },
        { input: minPurchaseInput, errorId: "min-purchase-error", message: "Min purchase amount is required", event: "blur" },
        { input: usageLimitInput, errorId: "usage-limit-error", message: "Limit is required", event: "blur" },
        { input: startDateInput, errorId: "start-date-error", message: "Start date is required", event: "change" },
        { input: expiryDateInput, errorId: "expiry-date-error", message: "Expiry date is required", event: "change" },
    ];

    fields.forEach(({ input, errorId, message, event }) => {
        input.addEventListener(event, () => validate(input, errorId, message));
    });

    function updateDiscountVisibility() {
        const selectedType = discountTypeSelect.value;
        if (selectedType === "percentage") {
            discountPercentageContainer.classList.remove("d-none");
            discountPercentageInput.disabled = false;

            discountFixedContainer.classList.add("d-none");
            discountFixedInput.disabled = true;

            maxDiscountContainer.classList.remove("d-none");
        } else {
            discountPercentageContainer.classList.add("d-none");
            discountPercentageInput.disabled = true;

            discountFixedContainer.classList.remove("d-none");
            discountFixedInput.disabled = false;

            maxDiscountContainer.classList.add("d-none");
        }
    }

    discountTypeSelect.addEventListener("change", () => {
        updateDiscountVisibility();
        // Validate fields when switching to refresh errors
        if (discountTypeSelect.value === "percentage") {
            validate(discountPercentageInput, "discount-percentage-error", "Discount percentage is required");
        } else {
            validate(discountFixedInput, "discount-fixed-error", "Discount amount is required");
        }
    });

    // Run on load
    updateDiscountVisibility();

    form.addEventListener("submit", (e) => {
        // If fixed type is chosen, automatically set maxDiscount to the discount fixed value to satisfy backend validation
        if (discountTypeSelect.value === "fixed") {
            maxDiscountInput.value = discountFixedInput.value || "0";
        }

        const activeFields = fields.filter(({ input }) => {
            if (input === discountPercentageInput) {
                return discountTypeSelect.value === "percentage";
            }
            if (input === discountFixedInput) {
                return discountTypeSelect.value === "fixed";
            }
            return true;
        });

        const results = activeFields.map(({ input, errorId, message }) => validate(input, errorId, message));
        const allValid = results.every(Boolean);

        if (!allValid) {
            return e.preventDefault();
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Coupon...";
    });
});
