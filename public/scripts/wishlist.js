const wishlistItem = document.querySelectorAll(".wishlist-item");
const wishlistDelete = document.querySelectorAll(".wishlist-remove");

wishlistDelete.forEach((btn) => {
    btn.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        console.log("item id", itemId);
        try {
            const result = await fetch(`/wishlist/delete/${itemId}`, { method: "DELETE" });
            const data = await result.json();
            if (data.success) {
                document.querySelector(`.wishlist-item[data-item-id="${itemId}"]`).remove();
            }
        } catch (err) {
            console.error(err);
        }
    });
});
