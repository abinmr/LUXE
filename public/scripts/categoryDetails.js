document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.remove("text-success", "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    const productGrid = document.getElementById("product-grid");
    const sortSelect = document.getElementById("filter");
    const mobileForm = document.getElementById("mobileFilterForm");
    const desktopForm = document.getElementById("desktopFilterForm");
    const categoryId = window.categoryId;

    attachCartListeners();

    function syncForms(sourceForm, targetForm) {
        if (!targetForm) return;
        ["size", "color"].forEach((name) => {
            const sourceBoxes = sourceForm.querySelectorAll(`input[name="${name}"]`);
            const targetBoxes = targetForm.querySelectorAll(`input[name="${name}"]`);
            sourceBoxes.forEach((cb, i) => {
                if (targetBoxes[i]) targetBoxes[i].checked = cb.checked;
            });
        });
    }

    [mobileForm, desktopForm].forEach((form) => {
        if (!form) return;
        const priceInput = form.querySelector('input[name="priceRange"]');
        const maxRangeSpan = priceInput.nextElementSibling.querySelector("span:last-child");

        priceInput.addEventListener("input", () => {
            maxRangeSpan.innerText = "₹" + priceInput.value;
            const otherForm = form === mobileForm ? desktopForm : mobileForm;
            if (otherForm) {
                const otherPrice = otherForm.querySelector('input[name="priceRange"]');
                otherPrice.value = priceInput.value;
                otherPrice.nextElementSibling.querySelector("span:last-child").innerText = "₹" + priceInput.value;
            }
        });

        form.addEventListener("change", () => {
            const otherForm = form === mobileForm ? desktopForm : mobileForm;
            if (otherForm) syncForms(form, otherForm);
            fetchFilteredProducts(form);
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            const activeForm = desktopForm || mobileForm;
            fetchFilteredProducts(activeForm);
        });
    }

    async function fetchFilteredProducts(sourceForm) {
        const formObj = sourceForm && sourceForm instanceof HTMLFormElement ? sourceForm : desktopForm || mobileForm;
        if (!formObj) return;
        const formData = new FormData(formObj);

        const sizes = formData.getAll("size");
        const colors = formData.getAll("color");
        const price = formData.get("priceRange") || "500";
        const sort = sortSelect ? sortSelect.value : "featured";

        try {
            const response = await fetch(`/category/${categoryId}/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceRange: price,
                    sizes,
                    colors,
                    sort,
                }),
            });

            const data = await response.json();

            if (data.success) {
                renderProducts(data.products, data.userWishlist);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    }

    function renderProducts(products, userWishlist) {
        productGrid.innerHTML = "";

        if (products.length === 0) {
            productGrid.innerHTML = `<div class="col-12 text-center mt-5"><p class="text-muted">No products found matching your criteria.</p></div>`;
            return;
        }

        products.forEach((product) => {
            if (!product.variants || product.variants.length === 0) return;

            const variant = product.variants[0];
            const size = variant.sizes[0];
            const price = size.price;
            const comparePrice = size.compareAtPrice;

            let discount = 0;
            if (comparePrice > price) {
                discount = Math.round(((comparePrice - price) / comparePrice) * 100);
            }

            const isInWishlist = userWishlist && userWishlist.includes(product._id.toString());
            const wishlistIcon = isInWishlist ? `<i class="bi bi-heart-fill text-danger fs-5"></i>` : `<i class="bi bi-heart fs-5"></i>`;
            const wishlistClass = isInWishlist ? "wishlistRemove-btn" : "wishlistAdd-btn";

            const discountBadge = discount > 0 ? `<span class="position-absolute top-0 start-0 badge bg-danger m-3 py-1 px-2 rounded-1 fw-medium">-${discount}%</span>` : "";

            const compareHtml = comparePrice > price ? `<span class="text-decoration-line-through text-muted fw-normal" style="font-size: 0.85rem;">₹${comparePrice}</span>` : "";

            productGrid.innerHTML += `
                        <div class="col-12 col-sm-6 col-md-6 col-xl-4 mb-4">
                            <div class="card h-100 border rounded-3 overflow-hidden shadow-sm" style="background-color: #f6f6f6;">
                                
                                <div class="position-relative">
                                    <a href="/product/${product._id}" class="text-decoration-none d-block overflow-hidden" style="height: 400px;">
                                        <img src="${variant.images[0]}" alt="${product.name}" class="card-img-top object-fit-cover w-100 h-100 img-animation" style="border-bottom: 1px solid #eaeaea;">
                                    </a>
                                    
                                    ${discountBadge}

                                    <button data-item-id="${product._id}" class="btn glass text-dark position-absolute top-0 end-0 m-2 rounded-circle text-decoration-none ${wishlistClass}" aria-label="Add to wishlist">
                                        ${wishlistIcon}
                                    </button>
                                </div>

                                <div class="card-body d-flex flex-column p-3">
                                    <h6 class="card-title fw-semibold text-truncate mb-1" title="${product.name}">${product.name}</h6>
                                    
                                    <div class="mb-3 d-flex align-items-center gap-2">
                                        <span class="fw-bold fs-5 mb-0 text-dark">₹${price}</span>
                                        ${compareHtml}
                                    </div>

                                    <form action="/cart/add" method="POST" class="mt-auto cart-form">
                                        <input type="hidden" name="productId" value="${product._id}">
                                        <input type="hidden" name="variantId" value="${variant._id}">
                                        <input type="hidden" name="sizeId" value="${size._id}">
                                        <input type="hidden" name="quantity" value="1">
                                        
                                        <button class="btn btn-danger w-100 rounded-2 fw-medium d-flex align-items-center justify-content-center gap-2 py-2" style="background-color: #c94646; border-color: #c94646;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
                                            Add to Cart
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    `;
        });

        attachWishlistListeners();
        attachCartListeners();
    }

    function attachCartListeners() {
        const newCartForms = productGrid.querySelectorAll(".cart-form");
        newCartForms.forEach((form) => {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = {
                    productId: form.productId.value,
                    variantId: form.variantId.value,
                    sizeId: form.sizeId.value,
                    quantity: form.quantity.value,
                };
                try {
                    const response = await fetch("/cart/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast(result.message);
                    } else {
                        showToast(result.error, "error");
                    }
                } catch (err) {
                    console.error("form submit failed", err);
                }
            });
        });
    }

    function attachWishlistListeners() {
        const buttons = productGrid.querySelectorAll(".wishlistAdd-btn, .wishlistRemove-btn");
        buttons.forEach((button) => {
            button.addEventListener("click", async function (e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
                const icon = this.querySelector("i");
                const isAdded = icon.classList.contains("bi-heart-fill");

                try {
                    if (isAdded) {
                        const result = await fetch("/wishlist/delete/" + itemId, { method: "DELETE" });
                        const data = await result.json();
                        if (data.success) {
                            icon.classList.remove("bi-heart-fill", "text-danger");
                            icon.classList.add("bi-heart");
                            this.classList.remove("wishlistRemove-btn");
                            this.classList.add("wishlistAdd-btn");
                            showToast(data.message);
                        }
                    } else {
                        const result = await fetch("/wishlist/add/" + itemId);
                        const data = await result.json();
                        if (data.success) {
                            icon.classList.remove("bi-heart");
                            icon.classList.add("bi-heart-fill", "text-danger");
                            this.classList.remove("wishlistAdd-btn");
                            this.classList.add("wishlistRemove-btn");
                            showToast(data.message);
                        }
                    }
                } catch (err) {
                    console.error("Wishlist error:", err);
                }
            });
        });
    }
});
