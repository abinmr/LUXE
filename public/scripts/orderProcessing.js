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
    const refundBtn = document.getElementById("refund-btn");
    const refundInput = document.getElementById("refund");
    const calculateBtn = document.getElementById("calculate-btn");
    const returnModalBtn = document.getElementById("process-return-btn");
    const orderStatusBtn = document.getElementById("order-status-btn");
    const form = document.getElementById("admin-return-form");

    function calculateTotal() {
        const inputs = form.querySelectorAll('input[name="product"]:checked');
        const result = [];
        inputs.forEach((input) => {
            const price = input.dataset.price;
            result.push(Number(price));
        });
        const total = result.reduce((acc, curr) => acc + curr, 0);
        refundInput.value = total;
    }

    calculateBtn.addEventListener("click", () => {
        calculateTotal();
        const value = refundInput.value.trim();
        if (value.length > 0 && Number(value) > 0) {
            refundBtn.disabled = false;
        } else {
            refundBtn.disabled = true;
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = form.dataset.id;

        // Build body manually to handle multiple checkboxes with same name
        const body = {};
        body["admin-note"] = formData.get("admin-note") || "";
        body["refund"] = formData.get("refund") || "";
        // Get ALL selected product checkboxes (not just one)
        body["product"] = formData.getAll("product");

        const response = await fetch(`/admin/orders/${id}/approve-return`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById("returnModal"));
            modal.hide();
            showToast(data.message);

            // Update per-item status badges to "returned"
            if (data.returnedItems && data.returnedItems.length > 0) {
                data.returnedItems.forEach((itemId) => {
                    const badge = document.querySelector(`.item-status-badge[data-item-id="${itemId}"]`);
                    if (badge) {
                        badge.textContent = "returned";
                        badge.classList.remove("btn-light", "btn-success", "border");
                        badge.classList.add("btn-danger");
                    }
                });
            }

            // Hide the Process Return button
            if (returnModalBtn) {
                returnModalBtn.remove();
            }
        }
    });
});
