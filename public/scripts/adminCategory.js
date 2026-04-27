const categoryNameInput = document.getElementById("categoryName");
const categoryNameError = document.getElementById("categoryNameError");
const categoryDescription = document.getElementById("description");
const catDescriptionError = document.getElementById("descError");
const hiddenInputDivContainer = document.getElementById("hiddenInputContainer");
const imageError = document.getElementById("image-error");
const categoryBtn = document.getElementById("add-category-btn");
const categoryForm = document.getElementById("form");

function validateCategoryName() {
    const name = categoryNameInput.value.trim();
    if (name === "") {
        categoryNameError.textContent = "category name is required";
        categoryNameError.style.visibility = "visible";
        return false;
    } else {
        categoryNameError.textContent = "";
        categoryNameError.style.visibility = "hidden";
        return true;
    }
}

function validateCategoryDesc() {
    const description = categoryDescription.value.trim();
    if (description === "") {
        catDescriptionError.textContent = "description is required";
        catDescriptionError.style.visibility = "visible";
        return false;
    } else {
        catDescriptionError.textContent = "";
        catDescriptionError.style.visibility = "hidden";
        return true;
    }
}

function validateImageFile() {
    const uploadedImageInput = hiddenInputDivContainer.querySelector('input[type="file"][name="image"]');

    if (!uploadedImageInput || !uploadedImageInput.files || !uploadedImageInput.files.length === 0) {
        imageError.textContent = "Image is required";
        imageError.style.visibility = "visible";
        return false;
    } else {
        imageError.textContent = "";
        imageError.style.visibility = "hidden";
        return true;
    }
}

categoryNameInput.addEventListener("blur", validateCategoryName);
categoryDescription.addEventListener("blur", validateCategoryDesc);

categoryForm.addEventListener("submit", (e) => {
    const isNameValid = validateCategoryName();
    const isDescValid = validateCategoryDesc();
    const isFileValid = validateImageFile();

    if (!isNameValid || !isDescValid || !isFileValid) {
        return e.preventDefault();
    }
    categoryBtn.disabled = true;
    categoryBtn.textContent = "Creating category...";
});

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

let currentHiddenInput = null; // only one at a time

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
