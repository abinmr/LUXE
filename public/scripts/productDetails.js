let selectedVariant = productData.variants[0];
let selectedSize = selectedVariant.sizes[0];

function selectColor(buttonElement, variantId) {
    selectedVariant = productData.variants.find((v) => v._id === variantId);
    selectedSize = selectedVariant.sizes[0]; // reset to first size

    document.getElementById("inputVariantId").value = selectedVariant._id;
    document.getElementById("inputSizeId").value = selectedSize._id;

    document.querySelectorAll(".btn-color").forEach((btn) => {
        btn.classList.remove("border-danger");
        btn.classList.add("border-light-subtle");
    });
    buttonElement.classList.remove("border-light-subtle");
    buttonElement.classList.add("border-danger");

    renderImages();
    renderSizes();
    renderQuantity();
}

function selectSize(sizeId) {
    selectedSize = selectedVariant.sizes.find((s) => s._id === sizeId);

    document.getElementById("inputSizeId").value = selectedSize._id;
    document.getElementById("displayPrice").innerText = selectedSize.price;
    document.getElementById("displayCompareAtPrice").innerText = selectedSize.compareAtPrice ? "₹" + selectedSize.compareAtPrice : "";

    renderSizes();
    renderQuantity();
}

function renderSizes() {
    const container = document.getElementById("sizeContainer");
    container.innerHTML = "";

    selectedVariant.sizes.forEach((size) => {
        const isActive = size._id === selectedSize._id;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn ${isActive ? "btn-danger" : "btn-light"} border-light-subtle px-4`;
        btn.textContent = size.size;
        btn.onclick = () => selectSize(size._id);
        container.appendChild(btn);
    });

    document.getElementById("displayPrice").innerText = selectedSize.price;
    document.getElementById("displayCompareAtPrice").innerText = selectedSize.compareAtPrice ? "₹" + selectedSize.compareAtPrice : "";
    document.getElementById("inputSizeId").value = selectedSize._id;
}

function renderQuantity() {
    const stock = selectedSize.stock;
    const maxStock = Math.min(10, stock);
    const select = document.getElementById("quantitySelect");
    const badge = document.getElementById("stockBadge");

    select.innerHTML = "";
    if (stock === 0) {
        select.innerHTML = `<option value='0' disabled>Out of Stock</option>`;
        badge.innerHTML = "Out of Stock";
        badge.className = "text-danger small fw-bold";
        return;
    }

    for (let i = 1; i <= maxStock; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }

    if (stock <= 10) {
        badge.textContent = `Only ${stock} left!`;
        badge.className = "text-warning small fw-bold";
    } else {
        badge.textContent = "In stock";
        badge.className = "text-success small fw-bold";
    }
}

function renderImages() {
    const images = selectedVariant.images;
    const mainImg = document.getElementById("mainImage");
    const thumbContainer = document.getElementById("thumbnailContainer");

    mainImg.src = images[0] || "";
    thumbContainer.innerHTML = "";

    images.forEach((imgSrc, i) => {
        const thumb = document.createElement("img");
        thumb.src = imgSrc;
        thumb.className = "thumbnail-img" + (i === 0 ? " active" : "");
        thumb.alt = "Product thumbnail";
        thumb.onclick = () => selectThumbnail(thumb, imgSrc);
        thumbContainer.appendChild(thumb);
    });
}

function selectThumbnail(thumbEl, imgSrc) {
    document.getElementById("mainImage").src = imgSrc;
    document.querySelectorAll(".thumbnail-img").forEach((t) => t.classList.remove("active"));
    thumbEl.classList.add("active");
}

renderImages();
renderSizes();
renderQuantity();
document.querySelector('form[action="/cart/add"]').addEventListener("submit", function () {
    console.log("Submitting:");
    console.log("Product ID:", document.getElementById("inputProductId")?.value);
    console.log("Variant ID:", document.getElementById("inputVariantId").value);
    console.log("Size ID:", document.getElementById("inputSizeId").value);
});
