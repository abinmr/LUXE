const tables = document.querySelectorAll(".table");
const deleteBtn = document.querySelectorAll(".delete-btn");
const productView = document.querySelectorAll(".product-view");

deleteBtn.forEach((table) => {
    table.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        // console.log("itemId", itemId);
        try {
            const result = await fetch(`/admin/products/delete/${itemId}`, { method: "DELETE" });
            const data = await result.json();
            if (data.success) {
                document.querySelector(`.table[data-item-id="${itemId}"]`).remove();
            }
        } catch (err) {
            console.error(err);
        }
    });
});

productView.forEach((btn) => {
    btn.addEventListener("click", async function () {
        const productId = this.dataset.itemId;
        const btnStatus = this.textContent.trim().toLowerCase();
        console.log("itemId", productId);
        console.log("btn status", btnStatus);
        if (btnStatus === "unlist") {
            const result = await fetch(`/admin/products/unlist/${productId}`, { method: "PATCH" });
            const badge = document.getElementById("badge");
            const data = await result.json();
            if (data.success) {
                this.textContent = "List";
                badge.textContent = "Unlisted";
                badge.classList.replace("btn-dark", "btn-light");
                badge.classList.add("border");
            }
        } else if (btnStatus === "list") {
            const result = await fetch(`/admin/products/list/${productId}`, { method: "PATCH" });
            const data = await result.json();
            if (data.success) {
                this.textContent = "Unlist";
                badge.textContent = "Listed";
                badge.classList.replace("btn-light", "btn-dark");
            }
        }
    });
});
