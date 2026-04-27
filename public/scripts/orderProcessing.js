const form = document.getElementById("admin-return-form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    console.log(formData);
});
