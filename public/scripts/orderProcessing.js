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
        if (value.length > 1) {
            refundBtn.disabled = false;
        } else {
            refundBtn.disabled = true;
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
        const id = form.dataset.id;
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
            returnModalBtn.remove();
            orderStatusBtn.textContent = "returned";
        }
    });
});
