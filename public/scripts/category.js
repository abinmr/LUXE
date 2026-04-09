const categoryStatus = document.querySelectorAll(".category-status");

categoryStatus.forEach((btn) => {
    btn.addEventListener("click", async function () {
        const categoryId = this.dataset.itemId;
        const btnStatus = this.textContent.trim().toLowerCase();
        const status = document.querySelector(`.table[data-item-id="${categoryId}"] .status-btn`);
        if (btnStatus === "list") {
            try {
                const response = await fetch(`/admin/categories/status/active/${categoryId}`, { method: "PATCH" });
                const result = await response.json();
                if (result.success) {
                    this.textContent = "Unlist";
                    status.textContent = "Active";
                    status.classList.replace("btn-light", "btn-dark");
                }
            } catch (err) {
                console.error(err);
            }
        } else if (btnStatus === "unlist") {
            const response = await fetch(`/admin/categories/status/inactive/${categoryId}`, { method: "PATCH" });
            const result = await response.json();
            if (result.success) {
                this.textContent = "List";
                status.textContent = "Inactive";
                status.classList.replace("btn-dark", "btn-light");
            }
        }
    });
});
