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
    const returnModalBtn = document.getElementById("process-return-btn");
    const orderStatusBtn = document.getElementById("order-status-btn");
    const form = document.getElementById("admin-return-form");

    // Enable/disable refund button based on checkbox selection
    const productCheckboxes = form ? form.querySelectorAll('input[name="product"]') : [];
    
    function toggleRefundButton() {
        const anyChecked = Array.from(productCheckboxes).some(cb => cb.checked);
        if (refundBtn) {
            refundBtn.disabled = !anyChecked;
        }
    }

    productCheckboxes.forEach(cb => {
        cb.addEventListener("change", toggleRefundButton);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = form.dataset.id;

        const body = Object.fromEntries(formData.entries());
        // body["admin-note"] = formData.get("admin-note") || "";
        // body["refund"] = formData.get("refund") || "";
        // body["product"] = formData.getAll("product");

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

            // Re-evaluate overall order status
            const allBadges = Array.from(document.querySelectorAll('.item-status-badge'));
            const statuses = allBadges.map(b => b.textContent.trim().toLowerCase());
            
            let newOverallStatus = statuses[0] || 'returned';
            let newBtnClass = 'btn-light border';

            const activeStatus = statuses.find(s => ['pending', 'processing', 'shipped'].includes(s));
            const hasReturnReq = statuses.includes('return-requested');
            
            if (activeStatus) {
                newOverallStatus = activeStatus;
            } else if (hasReturnReq) {
                newOverallStatus = 'return-requested';
                newBtnClass = 'btn-danger';
            } else {
                if (['cancelled', 'returned'].includes(newOverallStatus)) {
                    newBtnClass = 'btn-danger';
                } else if (newOverallStatus === 'delivered') {
                    newBtnClass = 'btn-success';
                }
            }

            if (orderStatusBtn) {
                orderStatusBtn.textContent = newOverallStatus;
                orderStatusBtn.className = `btn ${newBtnClass} rounded-3 text-capitalize`;
            }

            if (returnModalBtn) {
                returnModalBtn.remove();
            }
        }
    });
});
