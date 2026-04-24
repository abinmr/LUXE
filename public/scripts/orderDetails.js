document.addEventListener("DOMContentLoaded", () => {
    const cancelOrderBtn = document.getElementById("cancel-btn");
    const cancelForm = document.getElementById("cancel-form");
    const continueBtn = document.getElementById("continue");
    const reasonTextarea = document.getElementById("reason-textarea");

    reasonTextarea.addEventListener("input", () => {
        let len = reasonTextarea.value.length;
        if (len > 10) {
            continueBtn.disabled = false;
        } else {
            continueBtn.disabled = true;
        }
    });

    cancelForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(cancelForm);
        console.log("form data", formData);
        const id = reasonTextarea.dataset.id;
        const body = Object.fromEntries(formData.entries());
        console.log("body", body);

        const response = await fetch(`/profile/orders/${id}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "applicaton/json" },
            body: JSON.stringify(body),
        });
        console.log(response);
    });
});
