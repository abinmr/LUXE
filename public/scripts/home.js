document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
});
const wishlistAddBtn = document.querySelectorAll(".wishlistAdd-btn");
const wishlistRemoveBtn = document.querySelectorAll(".wishlistRemove-btn");
console.log(wishlistAddBtn);
wishlistAddBtn.forEach((button) => {
    button.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        const icon = button.querySelector("i");
        try {
            const result = await fetch(`/wishlist/add/${itemId}`);
            const data = await result.json();
            if (data.success) {
                icon.classList.remove("bi-heart");
                icon.classList.add("bi-heart-fill");
                icon.classList.add("text-danger");
            }
        } catch (err) {
            console.error("something went wrong", err);
        }
    });
});
wishlistRemoveBtn.forEach((button) => {
    button.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        const icon = button.querySelector("i");
        try {
            const result = await fetch(`/wishlist/remove/${itemId}`);
            const data = await result.json();
            if (data.success) {
                icon.classList.remove("bi-heart-fill");
                icon.classList.remove("text-danger");
                icon.classList.add("bi-heart");
            }
        } catch (err) {
            console.error("something went wrong", err);
        }
    });
});
