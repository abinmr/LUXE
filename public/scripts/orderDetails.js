document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;

    const cancelOrderBtn = document.getElementById("cancel-btn");
    const cancelForm = document.getElementById("cancel-form");
    const continueBtn = document.getElementById("continue");
    const radioBtns = document.querySelectorAll('input[name="reason"]');
    const orderStatusBtn = document.getElementById("order-status");

    const returnTextarea = document.getElementById("return-textarea");
    const continueReturn = document.getElementById("continue-return");
    const continueReturnBtn = document.getElementById("continue-return");
    const returnBtn = document.getElementById("return");
    const returnForm = document.getElementById("return-form");

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    radioBtns.forEach((radio) => {
        radio.addEventListener("change", () => {
            continueReturn.disabled = false;
            continueBtn.disabled = false;
        });
    });

    cancelForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(cancelForm);
        const id = cancelForm.dataset.id;
        const body = Object.fromEntries(formData.entries());

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
                cancelOrderBtn.remove();
                orderStatusBtn.classList.replace("btn-light", "btn-danger");
                orderStatusBtn.classList.remove("border");
                orderStatusBtn.textContent = "cancelled";
                showToast(data.message);
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
            const id = returnTextarea.dataset.id;
            const body = Object.fromEntries(formData.entries());
            const response = await fetch(`/profile/orders/${id}/return`, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById("returnModal"));
                modal.hide();
                continueReturnBtn.remove();
                orderStatusBtn.classList.replace("btn-light", "btn-danger");
                orderStatusBtn.classList.remove("border");
                orderStatusBtn.textContent = "Return requested";
                returnBtn.remove();
                showToast(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    });
});
