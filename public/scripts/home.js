document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
});
const wishlistBtns = document.querySelectorAll(".wishlistAdd-btn, .wishlistRemove-btn");

wishlistBtns.forEach((button) => {
    button.addEventListener("click", async function (e) {
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
            } else {
                const result = await fetch(`/wishlist/add/${itemId}`, { method: "GET" });
                const data = await result.json();
                if (data.success) {
                    icon.classList.remove("bi-heart");
                    icon.classList.add("bi-heart-fill", "text-danger");
                }
            }
        } catch (err) {
            console.error("something went wrong", err);
        }
    });
});
