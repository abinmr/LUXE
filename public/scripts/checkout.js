const fullnameInput = document.getElementById("fullName");
const fullnameError = document.getElementById("name-error");

const mobileInput = document.getElementById("mobile");
const mobileError = document.getElementById("mobile-error");

const pincodeInput = document.getElementById("pincode");
const pincodeError = document.getElementById("pincode-error");

const houseNumInput = document.getElementById("house");
const houseError = document.getElementById("house-error");

const streetInput = document.getElementById("street");
const streetError = document.getElementById("street-error");

const stateInput = document.getElementById("state");
const stateError = document.getElementById("city-error");

const form = document.getElementById("address");

function validateFullname() {
    const fullname = fullnameInput.value.trim();
    if (fullname === "") {
        fullnameError.textContent = "fullname is required";
        fullnameError.style.visibility = "visible";
        return false;
    } else {
        fullnameError.textContent = "";
        fullnameError.style.visibility = "hidden";
        return true;
    }
}

function validateMobile() {
    const mobile = mobileInput.value.trim();
    if (mobile === "") {
        mobileError.textContent = "mobile is required";
        mobileError.style.visibility = "visible";
        return false;
    } else {
        mobileError.textContent = "";
        mobileError.style.visibility = "hidden";
        return true;
    }
}

function validatePincode() {
    const pincode = pincodeInput.value.trim();
    if (pincode === "") {
        pincodeError.textContent = "pincode is required";
        pincodeError.style.visibility = "visible";
        return false;
    } else if (pincode.length < 6) {
        pincodeError.textContent = "please enter a valid pincode";
        pincodeError.style.visibility = "visible";
        return false;
    } else {
        pincodeError.textContent = "";
        pincodeError.style.visibility = "hidden";
        return true;
    }
}

function validateHouse() {
    const houseNum = houseNumInput.value.trim();
    if (houseNum === "") {
        houseError.textContent = "house number is required";
        houseError.style.visibility = "visible";
        return false;
    } else {
        houseError.textContent = "";
        houseError.style.visibility = "hidden";
        return true;
    }
}

function validateStreet() {
    const street = streetInput.value.trim();
    if (street === "") {
        streetError.textContent = "street is required";
        streetError.style.visibility = "visible";
        return false;
    } else {
        streetError.textContent = "";
        streetError.style.visibility = "hidden";
        return true;
    }
}

function validateState() {
    const state = stateInput.value.trim();
    if (state === "") {
        stateError.textContent = "state is required";
        stateError.style.visibility = "visible";
        return false;
    } else {
        stateError.textContent = "";
        stateError.style.visibility = "hidden";
        return true;
    }
}

fullnameInput.addEventListener("blur", validateFullname);
mobileInput.addEventListener("blur", validateMobile);
pincodeInput.addEventListener("blur", validatePincode);
houseNumInput.addEventListener("blur", validateHouse);
streetInput.addEventListener("blur", validateStreet);
stateInput.addEventListener("blur", validateState);

form.addEventListener("submit", (e) => {
    const isNameValid = validateFullname();
    const isMobileValid = validateMobile();
    const isPincodeValid = validatePincode();
    const isHouseValid = validateHouse();
    const isStreetValid = validateStreet();
    const isStateValid = validateState();

    if (!isNameValid || !isMobileValid || !isPincodeValid || !isHouseValid || !isStreetValid || !isStateValid) {
        e.preventDefault();
    }
});

const confirmAddressBtn = document.getElementById("confirmAddress");
if (confirmAddressBtn) {
    confirmAddressBtn.addEventListener("click", () => {
        const selected = document.querySelector('input[name="address"]:checked');
        if (!selected) return;

        // Read data attributes from selected radio
        const { fullname, phone, house, street, state, pincode } = selected.dataset;

        // Update the displayed address on the page
        document.getElementById("display-name").textContent = fullname;
        document.getElementById("display-phone").textContent = phone;
        document.getElementById("display-address").textContent = `${house}, ${street}`;
        document.getElementById("display-region").textContent = `${state}, ${pincode}`;

        // Store the selected address ID
        document.getElementById("selectedAddressId").value = selected.value;

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("changeAddress"));
        modal.hide();
    });
}
