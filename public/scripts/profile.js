document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById("editProfileBtn");
    const cancelBtn = document.getElementById("cancelProfileBtn");
    const updateDiv = document.getElementById("updateProfile");

    if (editBtn && updateDiv && cancelBtn) {
        editBtn.addEventListener("click", () => {
            editBtn.classList.add("d-none");

            updateDiv.classList.remove("d-none");
            updateDiv.classList.add("d-flex", "gap-3");
        });

        cancelBtn.addEventListener("click", () => {
            updateDiv.classList.remove("d-flex", "gap-3");
            updateDiv.classList.add("d-none");

            editBtn.classList.remove("d-none");
        });
    }
});
