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
const removeBtn = document.getElementById("removeBtn");

// ── X clicked: clear tile so user can pick a new image ────────────────────
if (removeBtn) {
    removeBtn.addEventListener("click", () => {
        clearAll();
        showAddBtn();
    });
}

// ── "Choose Image" clicked ────────────────────────────────────────────────
addImageBtn.addEventListener("click", () => triggerInput.click());

triggerInput.addEventListener("change", async () => {
    const originalFile = triggerInput.files[0];
    if (!originalFile) return;
    triggerInput.value = "";

    const file = await cropSingleFile(originalFile);
    if (!file) return; // user cancelled

    clearAll();

    // Dedicated hidden file input — reliable cross-browser form submission
    const dt = new DataTransfer();
    dt.items.add(file);
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.name = "image";
    hiddenInput.style.display = "none";
    hiddenInput.files = dt.files;
    hiddenInputContainer.appendChild(hiddenInput);

    // Show new preview tile
    const url = URL.createObjectURL(file);
    const tile = document.createElement("div");
    tile.className = "preview-item";
    tile.innerHTML = `
                    <img src="${url}" alt="new image">
                    <button type="button" class="remove-preview-btn" title="Change image">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>`;
    tile.querySelector(".remove-preview-btn").addEventListener("click", () => {
        URL.revokeObjectURL(url);
        clearAll();
        showAddBtn();
    });
    previewContainer.appendChild(tile);
    hideAddBtn();
});

function clearAll() {
    previewContainer.innerHTML = "";
    hiddenInputContainer.innerHTML = "";
}

function showAddBtn() {
    addImageBtn.style.display = "";
}
function hideAddBtn() {
    addImageBtn.style.display = "none";
}
