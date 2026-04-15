document.addEventListener("DOMContentLoaded", () => {
    // Toast elements
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };

    if (window.initialToast?.message) {
        showToast(window.initialToast.message, window.initialToast.type);
    }

    // ─── Profile Section ─────────────────────────────────────────────
    const editBtn = document.getElementById("editProfileBtn");
    const cancelBtn = document.getElementById("cancelProfileBtn");
    const updateDiv = document.getElementById("updateProfile");
    const profileInputs = document.querySelectorAll("#profileForm input");

    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const profileForm = document.getElementById("profileForm");

    const avatarWrapper = document.getElementById("avatarWrapper");
    const profileImageInput = document.getElementById("profileImageInput");
    const avatarImg = document.getElementById("avatarImg");

    if (avatarWrapper) {
        avatarWrapper.addEventListener("click", () => profileImageInput.click());
    }

    if (profileImageInput) {
        profileImageInput.addEventListener("change", () => {
            const file = profileImageInput.files[0];
            if (file) avatarImg.src = URL.createObjectURL(file);
        });
    }

    if (editBtn && updateDiv && cancelBtn) {
        editBtn.addEventListener("click", () => {
            profileImageInput.removeAttribute("disabled");
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
            profileImageInput.setAttribute("disabled", "disabled");

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

    if (emailInput) emailInput.addEventListener("blur", validateEmail);

    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            const isEmailValid = validateEmail();
            if (!isEmailValid) {
                e.preventDefault();
            }
        });
    }

    // ─── Password Section ────────────────────────────────────────────
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const currentPassError = document.getElementById("currentPasswordError");
    const newPassError = document.getElementById("newPasswordError");
    const confirmPassError = document.getElementById("confirmPasswordError");
    const passwordForm = document.getElementById("passwordForm");

    // Toggle password visibility — generic helper to avoid repetition
    function setupPasswordToggle(btnId, inputEl, iconId) {
        const btn = document.getElementById(btnId);
        const icon = document.getElementById(iconId);
        if (btn && inputEl && icon) {
            btn.addEventListener("click", () => {
                const type = inputEl.type === "password" ? "text" : "password";
                inputEl.setAttribute("type", type);
                icon.classList.toggle("bi-eye");
                icon.classList.toggle("bi-eye-slash");
            });
        }
    }

    setupPasswordToggle("toggle-current-password", currentPasswordInput, "current-eye-icon");
    setupPasswordToggle("toggle-new-password", newPasswordInput, "new-eye-icon");
    setupPasswordToggle("toggle-confirm-password", confirmPasswordInput, "confirm-eye-icon");

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
            return false;
        } else if (password.length < 8) {
            newPassError.innerText = "Password must be at least 8 characters";
            newPassError.style.visibility = "visible";
            return false;
        } else if (numberCount < 2) {
            newPassError.innerText = "Password must contain at least 2 numbers";
            newPassError.style.visibility = "visible";
            return false;
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            newPassError.innerText = "Password must contain 1 special character.";
            newPassError.style.visibility = "visible";
            return false;
        } else {
            newPassError.innerText = "placeholder";
            newPassError.style.visibility = "hidden";
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

    if (currentPasswordInput) currentPasswordInput.addEventListener("blur", validatePassword);
    if (newPasswordInput) newPasswordInput.addEventListener("blur", validateNewPassword);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

    if (passwordForm) {
        passwordForm.addEventListener("submit", (e) => {
            const isPasswordValid = validatePassword();
            const isNewPassValid = validateNewPassword();
            const isConfirmPassValid = validateConfirmPassword();

            if (!isPasswordValid || !isNewPassValid || !isConfirmPassValid) {
                e.preventDefault();
            }
        });
    }

    // ─── Address Section ─────────────────────────────────────────────
    // Generic field validator — eliminates all repetitive per-field functions.
    // Accepts the input element, its corresponding error element, and validation rules.
    function validateField(input, errorEl, rules) {
        const value = input.value.trim();

        for (const rule of rules) {
            if (!rule.test(value)) {
                errorEl.textContent = rule.message;
                errorEl.style.visibility = "visible";
                return false;
            }
        }

        errorEl.textContent = "";
        errorEl.style.visibility = "hidden";
        return true;
    }

    // Validation rule definitions for each address field
    const addressFieldRules = {
        fullName: [
            { test: (v) => v !== "", message: "fullname is required" },
        ],
        mobile: [
            { test: (v) => v.length > 0, message: "mobile number is required" },
            { test: (v) => /^\d{10}$/.test(v), message: "please enter a valid mobile number" },
        ],
        pincode: [
            { test: (v) => v !== "", message: "pincode is required" },
            { test: (v) => /^\d{6}$/.test(v), message: "please enter a valid pincode" },
        ],
        house: [
            { test: (v) => v !== "", message: "house number is required" },
        ],
        street: [
            { test: (v) => v !== "", message: "street is required" },
        ],
        state: [
            { test: (v) => v !== "", message: "state is required" },
        ],
    };

    // Validates all address fields ONLY within the given form element.
    // This fixes the core edit-modal bug: previously querySelectorAll grabbed
    // inputs from ALL forms, so submitting the edit modal also validated the
    // (empty) add modal inputs — and vice versa.
    function validateAddressForm(formEl) {
        const fieldMap = [
            { inputClass: "fullNameAddress", errorClass: "fullnameError", rules: addressFieldRules.fullName },
            { inputClass: "mobile-number", errorClass: "mobile-error", rules: addressFieldRules.mobile },
            { inputClass: "pincode", errorClass: "pincode-error", rules: addressFieldRules.pincode },
            { inputClass: "house-number", errorClass: "house-error", rules: addressFieldRules.house },
            { inputClass: "street", errorClass: "street-error", rules: addressFieldRules.street },
            { inputClass: "state", errorClass: "state-error", rules: addressFieldRules.state },
        ];

        let allValid = true;

        fieldMap.forEach(({ inputClass, errorClass, rules }) => {
            const input = formEl.querySelector(`.${inputClass}`);
            const errorEl = formEl.querySelector(`.${errorClass}`);

            if (input && errorEl) {
                const valid = validateField(input, errorEl, rules);
                if (!valid) allValid = false;
            }
        });

        return allValid;
    }

    // Attach blur listeners to every address form on the page.
    // Each blur validates only the field inside its own form.
    const allAddressForms = document.querySelectorAll(".form");

    allAddressForms.forEach((formEl) => {
        const blurFields = [
            { inputClass: "fullNameAddress", errorClass: "fullnameError", rules: addressFieldRules.fullName },
            { inputClass: "mobile-number", errorClass: "mobile-error", rules: addressFieldRules.mobile },
            { inputClass: "pincode", errorClass: "pincode-error", rules: addressFieldRules.pincode },
            { inputClass: "house-number", errorClass: "house-error", rules: addressFieldRules.house },
            { inputClass: "street", errorClass: "street-error", rules: addressFieldRules.street },
            { inputClass: "state", errorClass: "state-error", rules: addressFieldRules.state },
        ];

        blurFields.forEach(({ inputClass, errorClass, rules }) => {
            const input = formEl.querySelector(`.${inputClass}`);
            const errorEl = formEl.querySelector(`.${errorClass}`);

            if (input && errorEl) {
                input.addEventListener("blur", () => validateField(input, errorEl, rules));
            }
        });

        // Form submit — validate only THIS form's fields
        formEl.addEventListener("submit", (e) => {
            if (!validateAddressForm(formEl)) {
                e.preventDefault();
            }
        });
    });
});
