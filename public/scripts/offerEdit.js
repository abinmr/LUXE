document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const discountPercentageInput = document.getElementById("discountPercentage");
    const discountAmountInput = document.getElementById("discountAmount");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const minPurchaseInput = document.getElementById("min-purchase");
    const maxDiscountInput = document.getElementById("max-discount");
    /** @type {HTMLButtonElement} */
    const saveBtn = document.getElementById("save-btn");
    const offerForm = document.getElementById("offerForm");

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
        { input: titleInput, errorId: "title-error", message: "title is required", event: "blur" },
        { input: descriptionInput, errorId: "description-error", message: "description is required", event: "blur" },
        { input: discountPercentageInput, errorId: "discount-percentage-error", message: "discount percentage is required", event: "blur" },
        { input: discountAmountInput, errorId: "discount-amount-error", message: "discount amount is required", event: "blur" },
        { input: minPurchaseInput, errorId: "min-purchase-error", message: "minimum purchase amount is required", event: "blur" },
        { input: startDateInput, errorId: "start-date-error", message: "start date is required", event: "blur" },
        { input: endDateInput, errorId: "end-date-error", message: "end date is required", event: "blur" },
    ];

    fields.forEach(({ input, errorId, message, event }) => {
        input.addEventListener(event, () => validate(input, errorId, message));
    });

    offerForm.addEventListener("submit", (e) => {
        const activeFields = fields.filter(({ input }) => {
            if (input === discountAmountInput) {
                return offerTypeSelect.value === "flat";
            }
            if (input === discountPercentageInput) {
                return offerTypeSelect.value === "percentage";
            }

            return true;
        });
        const results = activeFields.map(({ input, errorId, message }) => validate(input, errorId, message));
        const allValid = results.every(Boolean);
        if (!allValid) {
            return e.preventDefault();
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving Changes...";
    });

    const offerTypeSelect = document.getElementById("offer-type");
    const discountPercentageContainer = document.getElementById("discount-percentage-container");
    const discountAmountContainer = document.getElementById("discount-amount-container");
    const maxDiscountContainer = document.getElementById("max-discount-container");

    function updateOfferTypeVisibility() {
        const selectedType = offerTypeSelect.value;

        if (selectedType === "percentage") {
            discountPercentageContainer.classList.remove("d-none");
            discountAmountContainer.classList.add("d-none");
            maxDiscountContainer.classList.remove("d-none");
        } else if (selectedType === "flat") {
            discountPercentageContainer.classList.add("d-none");
            discountAmountContainer.classList.remove("d-none");
            maxDiscountContainer.classList.add("d-none");
        } else if (selectedType === "free-shipping") {
            discountPercentageContainer.classList.add("d-none");
            discountAmountContainer.classList.add("d-none");
            maxDiscountContainer.classList.add("d-none");
        }

        // Clear discount amount error when switching away from flat
        if (selectedType !== "flat") {
            const discountAmountError = document.getElementById("discount-amount-error");
            if (discountAmountError) {
                discountAmountError.textContent = "";
                discountAmountError.style.display = "none";
            }
        }
    }

    updateOfferTypeVisibility();
    offerTypeSelect.addEventListener("change", updateOfferTypeVisibility);

    const applicableSelect = document.getElementById("applicable");
    const categoryListContainer = document.getElementById("category-list-container");
    const productListContainer = document.getElementById("product-list-container");

    function updateApplicabilityVisibility() {
        const selectedApplicable = applicableSelect.value;

        if (selectedApplicable === "all") {
            categoryListContainer.classList.add("d-none");
            productListContainer.classList.add("d-none");
        } else if (selectedApplicable === "category") {
            categoryListContainer.classList.remove("d-none");
            productListContainer.classList.add("d-none");
        } else if (selectedApplicable === "products") {
            categoryListContainer.classList.add("d-none");
            productListContainer.classList.remove("d-none");
        }
    }

    updateApplicabilityVisibility();
    applicableSelect.addEventListener("change", updateApplicabilityVisibility);

    let cropperInstance = null;
    let currentResolve = null;
    let currentFile = null;
    let currentObjURL = null;
    let croppedDataURL = null;

    const cropModalEl = document.getElementById("cropModal");
    const resultModalEl = document.getElementById("resultModal");
    const cropModal = new bootstrap.Modal(cropModalEl);
    const resultModal = new bootstrap.Modal(resultModalEl);
    const cropImg = document.getElementById("cropImg");
    const resultImg = document.getElementById("resultImg");

    function destroyCropper() {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }

    cropModalEl.addEventListener("shown.bs.modal", () => {
        destroyCropper();
        cropperInstance = new Cropper(cropImg, {
            viewMode: 1,
            dragMode: "move",
            aspectRatio: NaN,
            autoCropArea: 0.85,
            movable: true,
            zoomable: true,
            rotatable: false,
            scalable: false,
            background: false,
            guides: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
        });
    });

    cropModalEl.addEventListener("hidden.bs.modal", () => {
        destroyCropper();
    });

    document.getElementById("cropConfirmBtn").addEventListener("click", () => {
        if (!cropperInstance) return;
        cropperInstance
            .getCroppedCanvas({
                maxWidth: 2048,
                maxHeight: 2048,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "high",
            })
            .toBlob(
                (blob) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        croppedDataURL = e.target.result;
                        resultImg.src = croppedDataURL;
                        cropModal.hide();
                        resultModal.show();
                    };
                    reader.readAsDataURL(blob);
                },
                currentFile?.type || "image/jpeg",
                0.92,
            );
    });

    document.getElementById("resultRetryBtn").addEventListener("click", () => {
        resultModal.hide();
        resultModalEl.addEventListener(
            "hidden.bs.modal",
            () => {
                cropImg.src = currentObjURL;
                cropModal.show();
            },
            { once: true },
        );
    });

    document.getElementById("cropCancelBtn").addEventListener("click", () => {
        const resolve = currentResolve;
        currentResolve = null;
        cropModal.hide();
        if (currentObjURL) {
            URL.revokeObjectURL(currentObjURL);
            currentObjURL = null;
        }
        if (resolve) resolve(null);
    });

    document.getElementById("resultUseBtn").addEventListener("click", () => {
        const resolve = currentResolve;
        currentResolve = null;
        resultModal.hide();
        if (currentObjURL) {
            URL.revokeObjectURL(currentObjURL);
            currentObjURL = null;
        }

        fetch(croppedDataURL)
            .then((r) => r.blob())
            .then((blob) => {
                const file = new File([blob], currentFile?.name ?? "cropped.jpg", {
                    type: currentFile?.type || "image/jpeg",
                });
                if (resolve) resolve(file);
            });
    });

    function cropSingleFile(file) {
        return new Promise((resolve) => {
            currentFile = file;
            currentResolve = resolve;
            currentObjURL = URL.createObjectURL(file);
            croppedDataURL = null;
            cropImg.src = currentObjURL;
            cropModal.show();
        });
    }

    const addImageBtn = document.getElementById("addImageBtn");
    const triggerInput = document.getElementById("triggerInput");
    const previewContainer = document.getElementById("previewContainer");
    const hiddenInputContainer = document.getElementById("hiddenInputContainer");

    let currentHiddenInput = null;

    addImageBtn.addEventListener("click", () => triggerInput.click());

    triggerInput.addEventListener("change", async () => {
        const originalFile = triggerInput.files[0];
        if (!originalFile) return;
        triggerInput.value = "";

        const file = await cropSingleFile(originalFile);
        if (!file) return; // user cancelled

        clearSelection();

        const dt = new DataTransfer();
        dt.items.add(file);
        currentHiddenInput = document.createElement("input");
        currentHiddenInput.type = "file";
        currentHiddenInput.name = "image";
        currentHiddenInput.style.display = "none";
        currentHiddenInput.files = dt.files;
        hiddenInputContainer.appendChild(currentHiddenInput);

        const url = URL.createObjectURL(file);
        const item = document.createElement("div");
        item.className = "preview-item";
        item.innerHTML = `
                        <img src="${url}" alt="preview">
                        <button type="button" class="remove-preview-btn" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                        </button>`;
        item.querySelector(".remove-preview-btn").addEventListener("click", () => {
            URL.revokeObjectURL(url);
            clearSelection();
        });
        previewContainer.appendChild(item);

        addImageBtn.disabled = true;
    });

    function clearSelection() {
        previewContainer.innerHTML = "";
        hiddenInputContainer.innerHTML = "";
        currentHiddenInput = null;
        addImageBtn.disabled = false;
    }
});
