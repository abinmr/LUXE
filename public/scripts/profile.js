document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById("editProfileBtn");
    const cancelBtn = document.getElementById("cancelProfileBtn");
    const updateDiv = document.getElementById("updateProfile");
    const profileInputs = document.querySelectorAll("#profileForm input");

    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const profileForm = document.getElementById("profileForm");

    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const currentPassError = document.getElementById("currentPasswordError");
    const newPassError = document.getElementById("newPasswordError");
    const confirmPassError = document.getElementById("confirmPasswordError");
    const passwordForm = document.getElementById("passwordForm");

    if (editBtn && updateDiv && cancelBtn) {
        editBtn.addEventListener("click", () => {
            editBtn.classList.add("d-none");

            updateDiv.classList.remove("d-none");
            updateDiv.classList.add("d-flex", "gap-3");

            profileInputs.forEach((input) => {
                input.removeAttribute("readonly");
                input.classList.remove("text-muted");
            });
        });

        cancelBtn.addEventListener("click", () => {
            updateDiv.classList.remove("d-flex", "gap-3");
            updateDiv.classList.add("d-none");

            editBtn.classList.remove("d-none");

            profileInputs.forEach((input) => {
                input.setAttribute("readonly", true);
                input.classList.add("text-muted");
            });
        });
    }

    function validateEmail() {
        const email = emailInput.value.trim();

        if (email === "") {
            emailError.innerText = "email is required";
            emailError.style.visibility = "visible";
            return false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailError.innerText = "please enter a valid email";
            emailError.style.visibility = "visible";
            return false;
        } else {
            emailError.innerText = "placeholder";
            emailError.style.visibility = "hidden";
            return true;
        }
    }

    function validatePassword() {
        const password = currentPasswordInput.value.trim();

        if (password === "") {
            currentPassError.innerText = "Current password is required";
            currentPassError.style.visibility = "visible";
            return false;
        } else {
            currentPassError.innerText = "placeholder";
            currentPassError.style.visibility = "hidden";
            return true;
        }
    }

    function validateNewPassword() {
        const password = newPasswordInput.value.trim();
        const numberCount = (password.match(/[0-9]/g) || []).length;

        if (password === "") {
            newPassError.innerText = "This field is required";
            newPassError.style.visibility = "visible";
        } else if (password.length < 8) {
            newPassError.innerText = "Password must be at least 8 characters";
            newPassError.style.visibility = "visible";
        } else if (numberCount < 2) {
            newPassError.innerText = "Password must contain at least 2 numbers";
            newPassError.style.visibility = "visible";
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            newPassError.innerText = "Password must contain 1 special character.";
            newPassError.style.visibility = "visible";
        } else {
            passwordError.innerText = "placeholder";
            passwordError.style.visibility = "hidden";
            return true;
        }
    }

    function validateConfirmPassword() {
        const password = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (confirmPassword === "") {
            confirmPassError.innerText = "Please re-type your password";
            confirmPassError.style.visibility = "visible";
            return false;
        } else if (confirmPassword !== password) {
            confirmPassError.innerText = "Password do not match";
            confirmPassError.style.visibility = "visible";
            return false;
        } else {
            confirmPassError.innerText = "placeholder";
            confirmPassError.style.visibility = "hidden";
            return true;
        }
    }

    currentPasswordInput.addEventListener("blur", validatePassword);
    newPasswordInput.addEventListener("blur", validateNewPassword);
    confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

    passwordForm.addEventListener("submit", (e) => {
        const isPasswordValid = validatePassword();
        const isNewPassValid = validateNewPassword();
        const isConfirmPassValid = validateConfirmPassword();

        if (!isPasswordValid || !isNewPassValid || !isConfirmPassValid) {
            e.preventDefault();
        }
    });

    emailInput.addEventListener("blur", validateEmail);

    profileForm.addEventListener("submit", (e) => {
        const isEmailValid = validateEmail();
        if (!isEmailValid) {
            e.preventDefault();
        }
    });
});
