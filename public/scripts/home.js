document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;
    let svg = `
        `;

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = svg + message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    if (window.initialToast?.message) {
        showToast(window.initialToast.message, window.initialToast.type);
    }

    const wishlistBtns = document.querySelectorAll(".wishlistAdd-btn, .wishlistRemove-btn");

    const cartForms = document.querySelectorAll(".cart-form");

    wishlistBtns.forEach((button) => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            const itemId = this.dataset.itemId;
            const icon = this.querySelector("i");
            const isAdded = icon.classList.contains("bi-heart-fill");

            try {
                if (isAdded) {
                    const result = await fetch(`/wishlist/delete/${itemId}`, { method: "DELETE" });
                    const data = await result.json();
                    if (data.success) {
                        icon.classList.remove("bi-heart-fill", "text-danger");
                        icon.classList.add("bi-heart");
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
                    }
                    showToast(data.message, data.success ? "success" : "error");
                }
            } catch (err) {
                console.error("something went wrong", err);
                showToast("Something went wrong", "error");
            }
        });
    });

    cartForms.forEach((form) => {
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
                // console.log("data", data);
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
});
