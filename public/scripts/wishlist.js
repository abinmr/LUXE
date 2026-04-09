const wishlistItem = document.querySelectorAll(".wishlist-item");
const wishlistDelete = document.querySelectorAll(".wishlist-remove");

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
