const form = document.getElementById("form");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const fullNameError = document.getElementById("fullNameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmError");

const togglePassword = document.getElementById("toggle-password");
const togglePassword2 = document.getElementById("toggle-password-2");
const eyeIcon = document.getElementById("eye-icon");
const eyeIcon2 = document.getElementById("eye-icon-2");

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

console.log("Script is loaded");

function validateFullName() {
    const fullName = fullNameInput.value.trim();
    if (fullName === "") {
        fullNameError.innerText = "Full name is required";
        fullNameError.style.visibility = "visible";
        return false;
    } else {
        fullNameError.innerText = "Placeholder";
        fullNameError.style.visibility = "hidden";
        return true;
    }
}

function validateEmail() {
    const email = emailInput.value.trim();
    if (email === "") {
        emailError.innerText = "Email is required to create an account";
        emailError.style.visibility = "visible";
        return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.innerText = "Please enter a valid email";
        emailError.style.visibility = "visible";
        return false;
    } else {
        emailError.innerText = "Placeholder";
        emailError.style.visibility = "hidden";
        return true;
    }
}

function validatePassword() {
    const password = passwordInput.value.trim();

    const numberCount = (password.match(/[0-9]/g) || []).length;

    if (password === "") {
        passwordError.innerText = "Password is required";
        passwordError.style.visibility = "visible";
        return false;
    } else if (password.length < 8) {
        passwordError.innerText = "Password must be at least 8 characters";
        passwordError.style.visibility = "visible";
        return false;
    } else if (numberCount < 2) {
        passwordError.innerText = "Password must contain at least 2 numbers";
        passwordError.style.visibility = "visible";
        return false;
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        passwordError.innerText = "Password must contain 1 special character.";
        passwordError.style.visibility = "visible";
        return false;
    } else {
        passwordError.innerText = "Placeholder";
        passwordError.style.visibility = "hidden";
        return true;
    }
}

function validateConfirmPassword() {
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (confirmPassword === "") {
        confirmError.innerText = "Please re-type your password";
        confirmError.style.visibility = "visible";
        return false;
    } else if (confirmPassword !== password) {
        confirmError.innerText = "Passwords do not match.";
        confirmError.style.visibility = "visible";
        return false;
    } else {
        confirmError.innerText = "Placeholder";
        confirmError.style.visibility = "hidden";
        return true;
    }
}

fullNameInput.addEventListener("blur", validateFullName);
emailInput.addEventListener("blur", validateEmail);
passwordInput.addEventListener("blur", validatePassword);
confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

form.addEventListener("submit", (e) => {
    const isNameValid = validateFullName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
        e.preventDefault();
    }
});
