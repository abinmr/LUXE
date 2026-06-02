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

    const couponList = document.querySelectorAll(".coupon-list");
    const deleteBtn = document.querySelectorAll(".delete-btn");

    couponList.forEach((button) => {
        button.addEventListener("click", async function () {
            const span = this.querySelector(".coupon-status");
            const text = span.textContent.trim().toLowerCase();
            const id = span.dataset.id;
            const statusBtn = document.querySelector(`.btn-badge[data-id="${id}"]`);

            if (text === "unlist") {
                const res = await fetch(`/admin/coupons/status/unlist/${id}`, { method: "PATCH" });
                const data = await res.json();
                if (data.success) {
                    span.textContent = "List";
                    statusBtn.textContent = "Inactive";
                    statusBtn.classList.replace("btn-dark", "btn-light");
                    statusBtn.classList.add("border");
                    showToast(data.message);
                }
            } else if (text === "list") {
                const res = await fetch(`/admin/coupons/status/list/${id}`, { method: "PATCH" });
                const data = await res.json();
                if (data.success) {
                    span.textContent = "Unlist";
                    statusBtn.textContent = "Active";
                    statusBtn.classList.remove("border");
                    statusBtn.classList.replace("btn-light", "btn-dark");
                    showToast(data.message);
                }
            }
        });
    });

    deleteBtn.forEach((button) => {
        button.addEventListener("click", async () => {
            const id = button.dataset.id;
            try {
                const response = await fetch(`/admin/coupons/delete/${id}`, { method: "DELETE" });
                const data = await response.json();
                const tableRow = document.querySelector(`.table-row[data-item-id="${id}"]`);

                if (data.success) {
                    showToast(data.message);
                    tableRow.remove();
                } else {
                    showToast(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
});
