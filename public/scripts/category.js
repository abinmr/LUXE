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
                        showToast("category listed successfully");
                    } else {
                        showToast("error listing category", "error");
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
                    showToast("category unlisted successfully");
                } else {
                    showToast("error unlisting category", "error");
                }
            }
        });
    });
});
