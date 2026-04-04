const tables = document.querySelectorAll(".table");
const deleteBtn = document.querySelectorAll(".delete-btn");

deleteBtn.forEach((table) => {
    table.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        console.log("itemId", itemId);
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
