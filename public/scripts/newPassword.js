const passwordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const confirmPasswordError = document.getElementById("confirm-password-error");
const togglePassword = document.getElementById("toggle-password");
const togglePassword2 = document.getElementById("toggle-password2");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("form");

togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    if (type === "text") {
        eyeIcon.classList.remove("bi-eye-slash");
        eyeIcon.classList.add("bi-eye");
    } else {
        eyeIcon.classList.remove("bi-eye");
        eyeIcon.classList.add("bi-eye-slash");
    }
});
togglePassword2.addEventListener("click", () => {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.setAttribute("type", type);

    if (type === "text") {
        eyeIcon2.classList.remove("bi-eye-slash");
        eyeIcon2.classList.add("bi-eye");
    } else {
        eyeIcon2.classList.remove("bi-eye");
        eyeIcon2.classList.add("bi-eye-slash");
    }
});

function checkPasswordMatch() {
    const newPassword = passwordInput.value;
    const confirmNewPassword = confirmPasswordInput.value;
    if (newPassword !== confirmNewPassword) {
        confirmPasswordError.textContent = "password do not match";
        confirmPasswordError.style.visibility = "visible";
        return false;
    }
    confirmPasswordError.textContent = "";
    confirmPasswordError.style.visibility = "hidden";
    return true;
}

form.addEventListener("submit", (e) => {
    const isPasswordMatch = checkPasswordMatch();
    if (!isPasswordMatch) {
        return e.preventDefault();
    }
    submitBtn.disabled = true;
});
