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
    const deleteBtn = document.querySelectorAll(".delete-btn");

    deleteBtn.forEach((button) => {
        button.addEventListener("click", async function () {
            const id = this.dataset.id;
            try {
                const result = await fetch(`/admin/offers/delete/${id}`, { method: "patch" });
                const data = result.json();
                if (data.success) {
                    document.querySelector(`.offers[data-item-id="${id}"]`).remove();
                    showToast(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
});
