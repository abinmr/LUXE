const inputs = document.querySelectorAll(".otp-input");
const hiddenInput = document.getElementById("combinedOtp");
// const form = document.getElementById("otpForm");
const resendBtn = document.getElementById("resendBtn");
const countdownEl = document.getElementById("countdown");

inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
        updateHiddenInput();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

function updateHiddenInput() {
    let code = "";
    inputs.forEach((input) => {
        code += input.value;
    });
    hiddenInput.value = code;
}

let duration = 300;
let timer;

function startTimer() {
    resendBtn.disabled = true;

    timer = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        countdownEl.textContent = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

        duration--;

        if (duration < 0) {
            clearInterval(timer);
            resendBtn.disabled = false;
            countdownEl.textContent = "00:00";
        }
    }, 1000);
}

startTimer();
