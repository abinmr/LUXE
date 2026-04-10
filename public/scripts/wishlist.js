const wishlistItem = document.querySelectorAll(".wishlist-item");
const wishlistDelete = document.querySelectorAll(".wishlist-remove");
const cartForms = document.querySelectorAll(".cart-form");

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

wishlistDelete.forEach((btn) => {
    btn.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        console.log("item id", itemId);
        try {
            const result = await fetch(`/wishlist/delete/${itemId}`, { method: "DELETE" });
            const data = await result.json();
            if (data.success) {
                document.querySelector(`.wishlist-item[data-item-id="${itemId}"]`).remove();
                showToast(data.message);
            }
        } catch (err) {
            console.error(err);
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
