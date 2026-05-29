document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;

    const cancelForm = document.getElementById("cancel-form");
    const cancelOrderBtn = document.getElementById("continue");
    const radioBtns = document.querySelectorAll('input[name="reason"]');
    const orderStatusBtn = document.getElementById("order-status");

    const continueReturn = document.getElementById("continue-return");
    const returnForm = document.getElementById("return-form");

    let activeItemId = null;
    let activeButton = null;

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    document.querySelectorAll(".cancel-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            activeItemId = btn.dataset.itemId;
            activeButton = btn;
        });
    });

    document.querySelectorAll(".return-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            activeItemId = btn.dataset.itemId;
            activeButton = btn;
        });
    });

    radioBtns.forEach((radio) => {
        radio.addEventListener("change", () => {
            if (continueReturn) continueReturn.disabled = false;
            if (cancelOrderBtn) cancelOrderBtn.disabled = false;
        });
    });

    cancelForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(cancelForm);
        const id = cancelForm.dataset.id;
        const body = Object.fromEntries(formData.entries());
        body.itemId = activeItemId;
        cancelOrderBtn.disabled = true;
        cancelOrderBtn.textContent = "Cancelling";

        try {
            const response = await fetch(`/profile/orders/${id}/cancel`, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById("cancelModal"));
                modal.hide();
                if (activeButton) {
                    activeButton.remove();
                }
                showToast(data.message);
                if (activeItemId) {
                    const itemStatusBadge = document.getElementById(`item-status-${activeItemId}`);
                    if (itemStatusBadge) {
                        itemStatusBadge.textContent = "cancelled";
                        itemStatusBadge.className = "btn btn-danger btn-sm rounded-2 mt-2";
                    }
                }

                if (data.allCancelled && orderStatusBtn) {
                    orderStatusBtn.classList.replace("btn-light", "btn-danger");
                    orderStatusBtn.classList.remove("border");
                    orderStatusBtn.textContent = "cancelled";
                }
            } else {
                cancelOrderBtn.disabled = false;
                cancelOrderBtn.textContent = "Cancel";
            }
        } catch (err) {
            console.error(err);
            showToast("Cancellation failed", "error");
        }
    });

    returnForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(returnForm);
            const id = returnForm.dataset.id;
            const body = Object.fromEntries(formData.entries());
            body.itemId = activeItemId;
            continueReturn.disabled = true;

            const response = await fetch(`/profile/orders/${id}/return`, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById("returnModal"));
                modal.hide();
                if (activeButton) {
                    activeButton.remove();
                }
                showToast(data.message);
                if (activeItemId) {
                    const itemStatusBadge = document.getElementById(`item-status-${activeItemId}`);
                    if (itemStatusBadge) {
                        itemStatusBadge.textContent = "return-requested";
                        itemStatusBadge.className = "btn btn-danger btn-sm rounded-2 mt-2";
                    }
                }

                if (data.allReturnRequested && orderStatusBtn) {
                    orderStatusBtn.classList.replace("btn-light", "btn-danger");
                    orderStatusBtn.classList.remove("border");
                    orderStatusBtn.textContent = "Return requested";
                }
            } else {
                continueReturn.disabled = false;
            }
        } catch (err) {
            console.error(err);
        }
    });
});
