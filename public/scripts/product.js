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

    if (window.initialToast?.message) {
        showToast(window.initialToast.message, window.initialToast.type);
    }

    const tables = document.querySelectorAll(".table");
    const deleteBtn = document.querySelectorAll(".delete-btn");
    const productView = document.querySelectorAll(".product-view");

    deleteBtn.forEach((table) => {
        table.addEventListener("click", async function () {
            const itemId = this.dataset.itemId;
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

            const badge = document.querySelector(`.table[data-item-id="${productId}"] .badge-btn`);

            if (btnStatus === "unlist") {
                try {
                    const result = await fetch(`/admin/products/unlist/${productId}`, { method: "PATCH" });
                    const data = await result.json();
                    if (data.success) {
                        this.textContent = "List";
                        badge.textContent = "Unlisted";
                        badge.classList.replace("btn-dark", "btn-light");
                        badge.classList.add("border");
                        showToast("product unlisted successfully");
                    } else {
                        showToast("error unlisting product", "error");
                    }
                } catch (err) {
                    showToast("error unlisting product", "error");
                    console.error("error:", err);
                }
            } else if (btnStatus === "list") {
                try {
                    const result = await fetch(`/admin/products/list/${productId}`, { method: "PATCH" });
                    const data = await result.json();
                    if (data.success) {
                        this.textContent = "Unlist";
                        badge.textContent = "Listed";
                        badge.classList.replace("btn-light", "btn-dark");
                        badge.classList.remove("border");
                        showToast("product listed successfully");
                    } else {
                        showToast("error listing product", "error");
                    }
                } catch (err) {
                    showToast("error listing product", "error");
                    console.error(err);
                }
            }
        });
    });
});
