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
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    const updateBadge = (id, count) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = count;
        badge.style.display = count > 0 ? "" : "none";
    };

    if (window.initialToast?.message) {
        showToast(window.initialToast.message, window.initialToast.type);
    }

    const loadingSpinner = document.getElementById("loading");

    let page = 1;
    let loading = false;
    let hasMore = true;

    window.addEventListener("scroll", async () => {
        if (loading || !hasMore) return;

        const scrollPosition = window.innerHeight + window.scrollY;
        const bottom = document.body.offsetHeight - 100;
        loadingSpinner.style.display = "block";

        if (scrollPosition >= bottom) {
            loading = true;

            try {
                const response = await fetch(`/home/?page=${page}`, {
                    headers: { Accept: "application/json" },
                });
                const data = await response.json();

                if (!data.products || data.products.length === 0) {
                    hasMore = false;
                    loadingSpinner.style.display = "none";
                    return;
                }

                page++;
                appendProducts(data.products, data.wishlist);
            } catch (err) {
                console.error(err);
            } finally {
                loadingSpinner.style.display = "none";
                loading = false;
            }
        }
    });

    function appendProducts(products, wishlist) {
        const container = document.getElementById("product-container");
        products.forEach((product) => {
            if (!product.variants || product.variants.length === 0) return;

            const price = product.variants[0].sizes[0].price;
            const comparePrice = product.variants[0].sizes[0].compareAtPrice;

            let discount = 0;
            if (comparePrice > price) {
                discount = Math.round(((comparePrice - price) / comparePrice) * 100);
            }

            const isInWishlist = wishlist.includes(product._id.toString());

            const html = `
                <div class="col">
                    <div class="card h-100 border rounded-3 overflow-hidden shadow-sm" style="background-color: #ffffff">
                        <div class="position-relative">
                            <a href="/product/${product._id}" class="text-decoration-none d-block overflow-hidden" style="height: 400px">
                                <img src="${product.variants[0].images[0]}" alt="${product.name}" class="card-img-top object-fit-cover w-100 h-100 img-animation" style="border-bottom: 1px solid #eaeaea" />
                            </a>
 
                            ${
                                discount > 0
                                    ? `
                                <span class="position-absolute top-0 start-0 badge bg-danger m-3 py-1 px-2 rounded-1 fw-medium">
                                    -${discount}%
                                </span>
                            `
                                    : ""
                            }
 
                            <!-- FIX 2: data-item-id added to both buttons -->
                            ${
                                isInWishlist
                                    ? `
                                <button data-item-id="${product._id}" class="btn glass text-dark position-absolute top-0 end-0 m-2 rounded-circle text-decoration-none wishlistRemove-btn" aria-label="Remove from wishlist">
                                    <i class="bi bi-heart-fill text-danger fs-5"></i>
                                </button>
                            `
                                    : `
                                <button data-item-id="${product._id}" class="btn btn-light border-0 glass text-dark position-absolute top-0 end-0 m-2 rounded-circle text-decoration-none wishlistAdd-btn" aria-label="Add to wishlist">
                                    <i class="bi bi-heart fs-5"></i>
                                </button>
                            `
                            }
                        </div>
 
                        <div class="card-body d-flex flex-column p-3">
                            <h6 class="card-title fw-semibold text-truncate mb-1" title="${product.name}">${product.name}</h6>
                            <div class="mb-3 d-flex align-items-center gap-2">
                                <span class="fw-bold fs-5 mb-0 text-dark">₹${price}</span>
                                ${
                                    comparePrice > price
                                        ? `
                                    <span class="text-decoration-line-through text-muted fw-normal" style="font-size: 0.85rem">₹${comparePrice}</span>
                                `
                                        : ""
                                }
                            </div>
                            <form action="/cart/add" method="POST" class="mt-auto cart-form">
                                <input type="hidden" name="productId" value="${product._id}" />
                                <input type="hidden" name="variantId" value="${product.variants[0]._id}" />
                                <input type="hidden" name="sizeId" value="${product.variants[0].sizes[0]._id}" />
                                <input type="hidden" name="quantity" value="1" />
                                <button class="btn btn-danger w-100 rounded-2 fw-medium d-flex align-items-center justify-content-center gap-2 py-2" style="background-color: #c94646; border-color: #c94646">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="8" cy="21" r="1"></circle>
                                        <circle cx="19" cy="21" r="1"></circle>
                                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                                    </svg>
                                    Add to Cart
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML("beforeend", html);
        });
    }

    const container = document.getElementById("product-container");

    container.addEventListener("click", async function (e) {
        const button = e.target.closest(".wishlistAdd-btn, .wishlistRemove-btn");
        if (!button) return;

        e.preventDefault();
        const itemId = button.dataset.itemId;
        const icon = button.querySelector("i");
        const isAdded = icon.classList.contains("bi-heart-fill");

        try {
            if (isAdded) {
                const result = await fetch(`/wishlist/delete/${itemId}`, { method: "DELETE" });
                const data = await result.json();
                if (data.success) {
                    icon.classList.remove("bi-heart-fill", "text-danger");
                    icon.classList.add("bi-heart");
                    button.classList.remove("wishlistRemove-btn");
                    button.classList.add("wishlistAdd-btn");
                    if (data.totalWishlist !== undefined) updateBadge("wishlist-badge", data.totalWishlist);
                }
                showToast(data.message, data.success ? "success" : "error");
            } else {
                const result = await fetch(`/wishlist/add/${itemId}`, { method: "GET" });
                if (result.redirected) {
                    window.location = result.url;
                    return;
                }
                const data = await result.json();
                if (data.success) {
                    icon.classList.remove("bi-heart");
                    icon.classList.add("bi-heart-fill", "text-danger");
                    button.classList.remove("wishlistAdd-btn");
                    button.classList.add("wishlistRemove-btn");
                    if (data.totalWishlist !== undefined) updateBadge("wishlist-badge", data.totalWishlist);
                }
                showToast(data.message, data.success ? "success" : "error");
            }
        } catch (err) {
            console.error("something went wrong", err);
            showToast("Something went wrong", "error");
        }
    });

    document.addEventListener("submit", async (e) => {
        const form = e.target.closest(".cart-form");
        if (!form) return;

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                showToast(result.message);
                if (result.totalCart !== undefined) updateBadge("cart-badge", result.totalCart);
            } else {
                showToast(result.error, "error");
            }
        } catch (err) {
            console.error("form submit failed", err);
            showToast(err);
        }
    });
});
