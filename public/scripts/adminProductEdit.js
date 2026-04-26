import { document } from "pdfkit/js/page";

const MAX_IMAGES = 8;
let colorCount = document.querySelectorAll(".color-variant-block").length;

/* ── Shared cropper state ──────────────────────────────────── */
let cropperInstance = null;
let currentResolve = null; // resolves the promise for the active image
let currentFile = null; // the raw File being cropped
let currentObjURL = null; // object URL for the raw file
let croppedDataURL = null; // data-URL produced after cropping

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

function validateVariantImage() {
    const variants = document.querySelectorAll(".color-variant-block");
    let isValid = true;
    variants.forEach((variant) => {
        const imageError = variant.querySelector(".image-error");
        const existingCount = variant.querySelectorAll(".existing-image-item").length;
        const fileInput = variant.querySelector(".image-file-input");
        const newCount = fileInput ? fileInput.files.length : 0;
        const total = existingCount + newCount;

        if (total < 3) {
            imageError.textContent = "Each variant should have atleast 3 images";
            imageError.style.visiblity = "visible";
            isValid = false;
        } else {
            imageError.textContent = "";
            imageError.style.visiblity = "hidden";
        }
    });
    return isValid;
}

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

// ── Image picker ──────────────────────────────────────────────────────────
// Existing images are EJS-rendered .preview-item nodes already in the grid.
// New files are appended to the same grid as identical-looking .preview-item nodes.
// The cap is: existingCount + newFilesCount <= 8.
function setupImagePicker(block, ci) {
    const fileInput = block.querySelector(".image-file-input");
    const grid = block.querySelector(".image-preview-grid");
    const addBtn = block.querySelector(".add-images-btn");
    const counter = block.querySelector(".image-count");

    fileInput.name = `variants[${ci}][newImages]`;

    let newFiles = []; // pending File objects (not yet on server)

    function existingCount() {
        return grid.querySelectorAll(".existing-image-item").length;
    }

    function totalCount() {
        return existingCount() + newFiles.length;
    }

    function updateUI() {
        counter.textContent = `(${totalCount()}/8)`;
        addBtn.disabled = totalCount() >= MAX_IMAGES;
        const dt = new DataTransfer();
        newFiles.forEach((f) => dt.items.add(f));
        fileInput.files = dt.files;
    }

    function appendNewPreview(file, idx) {
        const url = URL.createObjectURL(file);
        const item = document.createElement("div");
        item.className = "preview-item new-image-item";
        item.dataset.idx = idx;
        item.innerHTML = `
                        <img src="${url}" alt="preview">
                        <button type="button" class="remove-preview-btn" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                        </button>`;
        item.querySelector(".remove-preview-btn").addEventListener("click", () => {
            URL.revokeObjectURL(url);
            const currentIdx = newFiles.indexOf(file);
            if (currentIdx !== -1) newFiles.splice(currentIdx, 1);
            item.remove();
            updateUI();
        });
        grid.appendChild(item);
    }

    grid.querySelectorAll(".remove-existing-image").forEach((btn) => {
        btn.addEventListener("click", () => {
            btn.closest(".existing-image-item").remove();
            updateUI();
        });
    });

    addBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
        const remaining = MAX_IMAGES - totalCount();
        const incoming = [...fileInput.files].slice(0, remaining);
        fileInput.value = ""; // reset so same file can be re-picked if needed
        const imageError = document.querySelector(".image-error")[0];
        const nonImage = incoming.filter((file) => !file.type.startsWith("image/"));
        if (nonImage.length > 0) {
            imageError.textContent = `${nonImage[0].name} is not a valid image file`;
            imageError.style.visiblity = "visible";
            return;
        }

        for (const file of incoming) {
            const result = await cropSingleFile(file);
            if (result) {
                newFiles.push(result);
                appendNewPreview(result, newFiles.length - 1);
            }
        }
        updateUI();
    });

    updateUI();
}

function sizeRowHTML(ci, si) {
    return `
                    <div class="size-row row g-2 align-items-center mb-2">
                        <div class="col"><input type="text"   class="form-control bg-light" name="variants[${ci}][sizes][${si}][size]"           placeholder="e.g., M"></div>
                        <div class="col"><input type="number" class="form-control bg-light" name="variants[${ci}][sizes][${si}][price]"          placeholder="0.00" step="0.01" min="0"></div>
                        <div class="col"><input type="number" class="form-control bg-light" name="variants[${ci}][sizes][${si}][compareAtPrice]" placeholder="0.00" step="0.01" min="0"></div>
                        <div class="col"><input type="number" class="form-control bg-light" name="variants[${ci}][sizes][${si}][stock]"          placeholder="0"    min="0"></div>
                        <div style="width:36px;">
                            <button type="button" class="btn btn-link text-muted p-0 remove-size-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                            </button>
                        </div>
                    </div>`;
}

// ── New variant block HTML ────────────────────────────────────────────────
function colorVariantHTML(ci) {
    return `
                    <div class="color-variant-block border rounded-4 bg-white mb-3">
                        <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
                            <span class="fw-semibold">Variant ${ci + 1}</span>
                            <button type="button" class="btn btn-link text-danger text-decoration-none p-0 remove-variant-btn d-flex align-items-center gap-1 small">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                Remove Variant
                            </button>
                        </div>
                        <div class="p-3">
                            <div class="row g-3 mb-3">
                                <div class="col">
                                    <label class="form-label small fw-semibold text-muted">Color Name</label>
                                    <input type="text" class="form-control bg-light" name="variants[${ci}][color]" placeholder="e.g., Black, Navy Blue, Red">
                                </div>
                                <div class="col">
                                    <label class="form-label small fw-semibold text-muted">
                                        Variant Images <span class="image-count text-muted fw-normal">(0/8)</span>
                                    </label>
                                    <div class="image-picker-area">
                                        <div class="image-preview-grid"></div>
                                        <button type="button" class="btn btn-light border btn-sm add-images-btn d-flex align-items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                            Add Images
                                        </button>
                                        <input type="file" class="image-file-input d-none" name="variants[${ci}][newImages]" accept="image/*" multiple>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-semibold text-muted">Sizes & Pricing</span>
                                <button type="button" class="btn btn-link text-primary text-decoration-none p-0 small add-size-btn d-flex align-items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                    Add Size
                                </button>
                            </div>
                            <div class="sizes-container">
                                <div class="row g-2 mb-1 px-1">
                                    <div class="col"><span class="small text-muted">Size</span></div>
                                    <div class="col"><span class="small text-muted">Price (INR)</span></div>
                                    <div class="col"><span class="small text-muted">Compare at (INR)</span></div>
                                    <div class="col"><span class="small text-muted">Stock</span></div>
                                    <div style="width:36px;"></div>
                                </div>
                                ${sizeRowHTML(ci, 0)}
                            </div>
                        </div>
                    </div>`;
}

// ── Reindex names after variant add/remove ────────────────────────────────
function reindex() {
    document.querySelectorAll(".color-variant-block").forEach((block, ci) => {
        block.querySelector(".fw-semibold").textContent = `Variant ${ci + 1}`;
        block.querySelector('[name*="[color]"]').name = `variants[${ci}][color]`;
        const variantIdInput = block.querySelector('.row.g-3.mb-3 > input[type="hidden"][name*="[_id]"]');
        if (variantIdInput) variantIdInput.name = `variants[${ci}][_id]`;
        block.querySelector(".image-file-input").name = `variants[${ci}][newImages]`;
        block.querySelectorAll('[name*="[existingImages]"]').forEach((inp) => {
            inp.name = `variants[${ci}][existingImages][]`;
        });
        block.querySelectorAll(".size-row").forEach((row, si) => {
            const sizeIdInput = row.querySelector('input[type="hidden"][name*="[_id]"]');
            if (sizeIdInput) sizeIdInput.name = `variants[${ci}][sizes][${si}][_id]`;
            row.querySelector('[name*="][size]"]').name = `variants[${ci}][sizes][${si}][size]`;
            row.querySelector('[name*="[price]"]').name = `variants[${ci}][sizes][${si}][price]`;
            row.querySelector('[name*="[compareAtPrice]"]').name = `variants[${ci}][sizes][${si}][compareAtPrice]`;
            row.querySelector('[name*="[stock]"]').name = `variants[${ci}][sizes][${si}][stock]`;
        });
    });
    colorCount = document.querySelectorAll(".color-variant-block").length;
}

function attachSizeBtn(block) {
    block.querySelector(".add-size-btn").addEventListener("click", () => {
        const ci = [...document.querySelectorAll(".color-variant-block")].indexOf(block);
        const sizesContainer = block.querySelector(".sizes-container");
        const si = sizesContainer.querySelectorAll(".size-row").length;
        sizesContainer.insertAdjacentHTML("beforeend", sizeRowHTML(ci, si));
        const newRow = sizesContainer.querySelectorAll(".size-row")[si];
        newRow.querySelector(".remove-size-btn").addEventListener("click", () => {
            newRow.remove();
            reindex();
        });
    });
}

function attachRemoveSizeBtns(block) {
    block.querySelectorAll(".remove-size-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            btn.closest(".size-row").remove();
            reindex();
        });
    });
}

function attachRemoveVariantBtn(block) {
    block.querySelector(".remove-variant-btn").addEventListener("click", () => {
        block.remove();
        reindex();
    });
}

document.getElementById("addVariantBtn").addEventListener("click", () => {
    const ci = colorCount;
    const container = document.getElementById("variantsContainer");
    container.insertAdjacentHTML("beforeend", colorVariantHTML(ci));
    const newBlock = container.querySelectorAll(".color-variant-block")[ci];
    setupImagePicker(newBlock, ci);
    attachSizeBtn(newBlock);
    attachRemoveSizeBtns(newBlock);
    attachRemoveVariantBtn(newBlock);
    colorCount++;
});

document.querySelectorAll(".color-variant-block").forEach((block, ci) => {
    setupImagePicker(block, ci);
    attachSizeBtn(block);
    attachRemoveSizeBtns(block);
    attachRemoveVariantBtn(block);
});
