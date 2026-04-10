const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");

function validateEmail() {
    const email = emailInput.value.trim();
    if (email === "") {
        emailError.innerText = "Email is required";
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

emailInput.addEventListener("blur", validateEmail);
passwordInput.addEventListener("blur", validatePassword);

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

form.addEventListener("submit", (e) => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
        e.preventDefault();
    }
});
