document.addEventListener("DOMContentLoaded", () => {
    const cancelOrderBtn = document.getElementById("cancel-btn");
    const cancelForm = document.getElementById("cancel-form");
    const continueBtn = document.getElementById("continue");
    const reasonInput = document.getElementById("reason");
    const reasonTextarea = document.getElementById("reason-textarea");

    reasonInput.addEventListener("input", () => {
        let len = reasonInput.value.length;
        if (len > 10) {
            continueBtn.disabled = false;
        }
    });

    cancelForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(cancelForm);
        const id = cancelOrderBtn.dataset.id;
        console.log(formData, id);
    });
});
