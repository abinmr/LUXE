document.addEventListener("DOMContentLoaded", () => {
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

    const forms = document.querySelectorAll(".form");
    const fullnameInputs = document.querySelectorAll(".fullNameAddress");
    const fullnameErrors = document.querySelectorAll(".fullnameError");
    const mobileInputs = document.querySelectorAll(".mobile-number");
    const mobileErrors = document.querySelectorAll(".mobile-error");
    const pincodeInputs = document.querySelectorAll(".pincode");
    const pincodeErrors = document.querySelectorAll(".pincode-error");
    const houseInputs = document.querySelectorAll(".house-number");
    const houseErrors = document.querySelectorAll(".house-error");
    const streetInputs = document.querySelectorAll(".street");
    const streetErrors = document.querySelectorAll(".street-error");
    const stateInputs = document.querySelectorAll(".state");
    const stateErrors = document.querySelectorAll(".state-error");

    const editAddressForm = document.getElementById("edit-form");

    const avatarWrapper = document.getElementById("avatarWrapper");
    const profileImageInput = document.getElementById("profileImageInput");
    const avatarImg = document.getElementById("avatarImg");

    const currentPasswordBtn = document.getElementById("toggle-current-password");
    const currentEyeIcon = document.getElementById("current-eye-icon");
    const newPasswordBtn = document.getElementById("toggle-new-password");
    const newEyeIcon = document.getElementById("new-eye-icon");
    const confirmPasswordBtn = document.getElementById("toggle-confirm-password");
    const confirmIcon = document.getElementById("confirm-eye-icon");

    if (currentPasswordBtn) {
        currentPasswordBtn.addEventListener("click", () => {
            const type = currentPasswordInput.type === "password" ? "text" : "password";
            currentPasswordInput.setAttribute("type", type);

            console.log(type);
            currentEyeIcon.classList.toggle("bi-eye");
            currentEyeIcon.classList.toggle("bi-eye-slash");
        });
    }

    if (newPasswordBtn) {
        newPasswordBtn.addEventListener("click", () => {
            const type = newPasswordInput.type === "password" ? "text" : "password";
            newPasswordInput.setAttribute("type", type);

            newEyeIcon.classList.toggle("bi-eye");
            newEyeIcon.classList.toggle("bi-eye-slash");
        });
    }

    if (confirmPasswordBtn) {
        confirmPasswordBtn.addEventListener("click", () => {
            const type = confirmPasswordInput.type === "password" ? "text" : "password";
            confirmPasswordInput.setAttribute("type", type);

            confirmIcon.classList.toggle("bi-eye");
            confirmIcon.classList.toggle("bi-eye-slash");
        });
    }

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

    function validateFullName() {
        let isValid = false;
        fullnameInputs.forEach((input, i) => {
            const fullname = input.value.trim();
            if (fullname === "") {
                fullnameErrors[i].textContent = "fullname is required";
                fullnameErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                fullnameErrors[i].textContent = "";
                fullnameErrors[i].style.visibility = "hidden";
                isValid = true;
            }
        });
        return isValid;
    }

    function validateMoblieNumber() {
        let isValid = false;
        mobileInputs.forEach((input, i) => {
            const number = input.value;
            const regex = /^\d{10}$/;
            if (number.toString().length === 0) {
                mobileErrors[i].textContent = "mobile number is required";
                mobileInputs[i].style.visibility = "visible";
            } else if (!regex.test(number)) {
                mobileErrors[i].textContent = "please enter a valid moblie number";
                mobileErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                mobileErrors[i].textContent = "";
                mobileErrors[i].style.visibility = "hidden";
                isValid = true;
            }
        });
        return isValid;
    }

    function validatePincode() {
        let isValid = false;
        pincodeInputs.forEach((input, i) => {
            const pincode = input.value;
            const regex = /^\d{6}$/;
            if (pincode === "") {
                pincodeErrors[i].textContent = "pincode is required";
                pincodeErrors[i].style.visibility = "visible";
                isValid = false;
            } else if (!regex.test(pincode)) {
                pincodeErrors[i].textContent = "please enter a valid pincode";
                pincodeErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                pincodeErrors[i].textContent = "";
                pincodeErrors[i].style.visibility = "hidden";
                isValid = true;
            }
        });
        return isValid;
    }

    function validateHouse() {
        let isValid = true;
        houseInputs.forEach((input, i) => {
            const houseNumber = input.value.trim();
            if (houseNumber === "") {
                houseErrors[i].textContent = "house number is required";
                houseErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                houseErrors[i].textContent = "";
                houseErrors[i].style.visibility = "hidden";
                isValid = true;
            }
        });
        return isValid;
    }

    function validateStreetAddress() {
        let isValid = false;
        streetInputs.forEach((input, i) => {
            const street = input.value.trim();
            if (street === "") {
                streetErrors[i].textContent = "street is required";
                streetErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                streetErrors[i].textContent = "";
                streetErrors[i].style.visibility = "hidden";
                isValid = true;
            }
        });
        return isValid;
    }

    function validateState() {
        let isValid = true;
        stateInputs.forEach((input, i) => {
            const state = input.value.trim();
            if (state === "") {
                stateErrors[i].textContent = "state is required";
                stateErrors[i].style.visibility = "visible";
                isValid = false;
            } else {
                stateErrors[i].textContent = "";
                stateErrors[i].style.visibility = "";
                isValid = true;
            }
        });
        return isValid;
    }

    if (fullnameInputs) {
        fullnameInputs.forEach((input) => {
            input.addEventListener("blur", validateFullName);
        });
    }

    if (mobileInputs) {
        mobileInputs.forEach((input) => {
            input.addEventListener("blur", validateMoblieNumber);
        });
    }

    if (pincodeInputs) {
        pincodeInputs.forEach((input) => {
            input.addEventListener("blur", validatePincode);
        });
    }

    if (houseInputs) {
        houseInputs.forEach((input) => {
            input.addEventListener("blur", validateHouse);
        });
    }

    if (streetInputs) {
        streetInputs.forEach((input) => {
            input.addEventListener("blur", validateStreetAddress);
        });
    }

    if (stateInputs) {
        stateInputs.forEach((input) => {
            input.addEventListener("blur", validateState);
        });
    }

    if (forms) {
        forms.forEach((form) => {
            form.addEventListener("submit", (e) => {
                const isFullNameValid = validateFullName();
                const isPhoneValid = validateMoblieNumber();
                const isPincodeValid = validatePincode();
                const isHouseValid = validateHouse();
                const isStreetValid = validateStreetAddress();
                const isStateValid = validateState();

                if (!isFullNameValid || !isPhoneValid || !isPincodeValid || !isHouseValid || !isStreetValid || !isStateValid) {
                    e.preventDefault();
                }
            });
        });
    }
});
