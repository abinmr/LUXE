document.addEventListener("DOMContentLoaded", () => {
    const couponList = document.getElementById("coupon-list");
    const couponStatus = document.querySelectorAll(".coupon-status");

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

    couponStatus.forEach((button) => {
        couponList.addEventListener("click", async function () {
            const text = button.textContent.trim().toLowerCase();
            const id = button.dataset.id;
            const statusBtn = document.querySelector(`.table[data-item-id="${id}"] .btn-badge`);
            if (text === "unlist") {
                const res = await fetch(`/admin/coupons/status/unlist/${id}`, { method: "PATCH" });
                const data = await res.json();
                if (data.success) {
                    button.textContent = "List";
                    statusBtn.textContent = "Inactive";
                    statusBtn.classList.replace("btn-dark", "btn-light");
                    statusBtn.classList.add("border");
                    showToast("coupon unlisted successfully");
                }
            } else if (text === "list") {
                const res = await fetch(`/admin/coupons/status/list/${id}`, { method: "PATCH" });
                const data = await res.json();
                if (data.success) {
                    button.textContent = "Unlist";
                    statusBtn.textContent = "Active";
                    statusBtn.classList.remove("border");
                    statusBtn.classList.replace("btn-light", "btn-dark");
                    showToast("coupon listed successfully");
                }
            }
        });
    });
});
