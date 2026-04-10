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

    const addressForm = document.getElementById("addAddress");
    const phoneNumber = document.getElementById("addPhone");
    const phoneError = document.getElementById("phoneError");
    const pincodeInput = document.getElementById("addPincode");
    const pincodeError = document.getElementById("pincodeError");

    const avatarWrapper = document.getElementById("avatarWrapper");
    const profileImageInput = document.getElementById("profileImageInput");
    const avatarImg = document.getElementById("avatarImg");

    const currentPasswordBtn = document.getElementById("toggle-current-password");
    const currentEyeIcon = document.getElementById("current-eye-icon");
    const newPasswordBtn = document.getElementById("toggle-new-password");
    const newEyeIcon = document.getElementById("new-eye-icon");
    const confirmPasswordBtn = document.getElementById("toggle-confirm-password");
    const confirmIcon = document.getElementById("confirm-eye-icon");

    currentPasswordBtn.addEventListener("click", () => {
        const type = currentPasswordInput.type === "password" ? "text" : "password";
        currentPasswordInput.setAttribute("type", type);

        currentEyeIcon.classList.toggle("bi-eye");
        currentEyeIcon.classList.toggle("bi-eye-slash");
    });

    newPasswordBtn.addEventListener("click", () => {
        const type = newPasswordInput.type === "password" ? "text" : "password";
        newPasswordInput.setAttribute("type", type);

        currentEyeIcon.classList.toggle("bi-eye");
        currentEyeIcon.classList.toggle("bi-eye-slash");
    });

    confirmPasswordBtn.addEventListener("click", () => {
        const type = confirmPasswordInput.type === "password" ? "text" : "password";
        confirmPasswordInput.setAttribute("type", type);

        currentEyeIcon.classList.toggle("bi-eye");
        currentEyeIcon.classList.toggle("bi-eye-slash");
    });

    avatarWrapper.addEventListener("click", () => profileImageInput.click());

    profileImageInput.addEventListener("change", () => {
        const file = profileImageInput.files[0];
        if (file) avatarImg.src = URL.createObjectURL(file);
    });

    if (editBtn && updateDiv && cancelBtn) {
        editBtn.addEventListener("click", () => {
            editBtn.classList.add("d-none");
            profileImageInput.removeAttribute("disabled");
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

    if (emailInput) emailInput.addEventListener("blur", validateEmail);

    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            const isEmailValid = validateEmail();
            if (!isEmailValid) {
                e.preventDefault();
            }
        });
    }

    function validatePhoneNumber() {
        const phone = phoneNumber.value.trim();
        const regex = /^\d{10}$/;
        if (!regex.test(phone)) {
            phoneError.innerText = "Please enter a valid phone number";
            phoneError.style.visibility = "visible";
            return false;
        } else {
            phoneError.innerText = "";
            phoneError.style.visibility = "hidden";
            return true;
        }
    }

    function validatePincode() {
        const pincode = pincodeInput.value.trim();
        const regex = /^\d{6}$/;
        if (!regex.test(pincode)) {
            pincodeError.innerText = "Please enter a valid pincode";
            pincodeError.style.visibility = "visible";
            return false;
        } else {
            pincode.innerText = "";
            pincode.style.visibility = "hidden";
            return true;
        }
    }

    if (addressForm && phoneNumber && pincodeInput) {
        phoneNumber.addEventListener("blur", validatePhoneNumber);
        pincodeInput.addEventListener("blur", validatePincode);
        addressForm.addEventListener("submit", (e) => {
            const isPhoneValid = validatePhoneNumber();
            const isPincodeValid = validatePincode();

            if (!isPhoneValid || !isPincodeValid) {
                e.preventDefault();
            }
        });
    }
});
