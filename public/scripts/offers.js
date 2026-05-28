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
            console.log(id);
            try {
                const result = await fetch(`/admin/offers/delete/${id}`, { method: "DELETE" });
                console.log("result", result);
                const data = await result.json();
                console.log("data", data);
                if (data.success) {
                    document.querySelector(`.offers[data-item-id="${id}"]`).remove();
                    showToast(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    });

    const statusBtns = document.querySelectorAll(".update-status");
    statusBtns.forEach((btn) => {
        btn.addEventListener("click", async function () {
            const text = btn.textContent.trim().toLowerCase();
            const id = this.dataset.id;
            const statusBtn = document.querySelector(`.statusBtn[data-id="${id}"]`);

            if (text === "list") {
                try {
                    const res = await fetch(`/admin/offers/list/${id}`, {
                        method: "PATCH",
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.textContent = "Unlist";
                        statusBtn.textContent = "Active";
                        statusBtn.classList.replace("btn-light", "btn-dark");
                        statusBtn.classList.remove("border");
                        showToast(data.message);
                    }
                } catch (err) {
                    console.error(err);
                }
            } else if (text === "unlist") {
                try {
                    const res = await fetch(`/admin/offers/unlist/${id}`, {
                        method: "PATCH",
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.textContent = "List";
                        statusBtn.textContent = "Inactive";
                        statusBtn.classList.replace("btn-dark", "btn-light");
                        statusBtn.classList.add("border");
                        showToast(data.message);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        });
    });
});
