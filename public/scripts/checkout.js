document.addEventListener("DOMContentLoaded", () => {
    const toastEl = document.getElementById("actionToast");
    const toastBodyEl = document.getElementById("actionToastBody");
    const toastIcon = document.getElementById("toast-icon");
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;

    const showToast = (message, type = "success") => {
        if (!toast || !toastBodyEl) return;
        toastBodyEl.textContent = message;
        toastBodyEl.classList.remove("text-success", "text-danger");
        toastBodyEl.classList.add(type === "success" ? "text-black" : "text-danger");
        toastIcon.classList.add(type === "success" ? "text-black" : "text-danger");
        toast.show();
    };
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

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const isNameValid = validateFullname();
        const isMobileValid = validateMobile();
        const isPincodeValid = validatePincode();
        const isHouseValid = validateHouse();
        const isStreetValid = validateStreet();
        const isStateValid = validateState();

        if (!isNameValid || !isMobileValid || !isPincodeValid || !isHouseValid || !isStreetValid || !isStateValid) return;
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
        const response = await fetch("/checkout/add-address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!data.success) return showToast(data.message, "error");
        const address = data.address;
        document.getElementById("selectedAddressId").value = address._id;
        document.getElementById("display-name").textContent = address.fullname;
        document.getElementById("display-phone").textContent = address.phone;
        document.getElementById("display-address").textContent = `${address.house}, ${address.street}`;
        document.getElementById("display-region").textContent = `${address.state}, ${address.pincode}`;

        const placeholder = document.getElementById("no-address-placeholder");
        if (placeholder) placeholder.classList.add("d-none");
        const addressDisplay = document.getElementById("address-display");
        if (addressDisplay) addressDisplay.classList.remove("d-none");

        togglePlaceOrder();
        const modal = bootstrap.Modal.getInstance(document.getElementById("addressModal"));
        modal.hide();
        form.reset();
    });

    const confirmAddressBtn = document.getElementById("confirmAddress");
    if (confirmAddressBtn) {
        confirmAddressBtn.addEventListener("click", () => {
            const selected = document.querySelector('input[name="address"]:checked');
            if (!selected) return;

            const { fullname, phone, house, street, state, pincode } = selected.dataset;

            document.getElementById("display-name").textContent = fullname;
            document.getElementById("display-phone").textContent = phone;
            document.getElementById("display-address").textContent = `${house}, ${street}`;
            document.getElementById("display-region").textContent = `${state}, ${pincode}`;

            document.getElementById("selectedAddressId").value = selected.value;

            const placeholder = document.getElementById("no-address-placeholder");
            if (placeholder) placeholder.classList.add("d-none");
            const addressDisplay = document.getElementById("address-display");
            if (addressDisplay) addressDisplay.classList.remove("d-none");

            togglePlaceOrder();

            const modal = bootstrap.Modal.getInstance(document.getElementById("changeAddress"));
            modal.hide();
        });
    }

    const couponForm = document.getElementById("coupon-form");
    const couponApplyBtn = document.getElementById("applyBtn");
    const couponCancelBtn = document.getElementById("cancelBtn");
    const input = document.getElementById("couponInput");
    const discountRow = document.getElementById("discount-row");
    couponForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("couponInput").value.trim().toUpperCase();

        const res = await fetch(`/checkout/apply-coupon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();

        const discount = document.getElementById("discount");
        if (data.success) {
            discountRow.classList.replace("d-none", "d-flex");
            discount.textContent = `-₹${data.discount}`;
            document.getElementById("total").textContent = `₹${data.total}`;
            input.disabled = true;
            couponApplyBtn.classList.add("d-none");
            couponCancelBtn.classList.remove("d-none");
            showToast(data.message);
        } else {
            showToast(data.message, "error");
        }
    });

    couponCancelBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/checkout/remove-coupon", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();

            if (data.success) {
                const discountRow = document.getElementById("discount-row");
                discountRow.classList.replace("d-flex", "d-none");
                document.getElementById("total").textContent = `₹${data.total}`;
                input.value = "";
                input.disabled = false;
                couponApplyBtn.classList.remove("d-none");
                couponCancelBtn.classList.add("d-none");
                showToast(data.message);
            } else {
                showToast(data.message, "error");
            }
        } catch (err) {
            console.error(err);
        }
    });

    const walletCheckbox = document.getElementById("wallet");
    const otherPaymentMethods = [document.getElementById("credit"), document.getElementById("upi"), document.getElementById("cod")];

    if (walletCheckbox) {
        walletCheckbox.addEventListener("change", (e) => {
            const isWalletSelected = e.target.checked;
            otherPaymentMethods.forEach((radio) => {
                if (radio) {
                    radio.disabled = isWalletSelected;
                    if (isWalletSelected) {
                        radio.checked = false;
                    }
                }
            });

            togglePlaceOrder();
        });
    }

    const placeOrderBtn = document.getElementById("place-order-btn");
    const selectedAddressInput = document.getElementById("selectedAddressId");
    const paymentRadios = document.querySelectorAll("input[name='paymentMethod']");

    function togglePlaceOrder() {
        const hasAddress = selectedAddressInput && selectedAddressInput.value.trim() !== "";
        const hasPayment = document.querySelector("input[name='paymentMethod']:checked");
        placeOrderBtn.disabled = !(hasAddress && hasPayment);
    }

    togglePlaceOrder();
    paymentRadios.forEach((radio) => {
        radio.addEventListener("change", togglePlaceOrder);
    });

    placeOrderBtn.addEventListener("click", async () => {
        const addressId = document.getElementById("selectedAddressId").value;
        const paymentMethod = document.querySelector("input[name='paymentMethod']:checked").id;
        const couponCode = document.getElementById("couponInput").value.trim();

        try {
            const response = await fetch("/checkout/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addressId, paymentMethod, couponCode }),
            });

            const data = await response.json();

            if (data.success) {
                if (data.razorpayOrderId) {
                    console.log(data.razorpayOrderId);
                    openRazorpay(data.order, data.razorpayOrderId, data.amount);
                } else {
                    window.location.href = `/checkout/success?orderId=${data.order}`;
                }
            } else {
                showToast(data.message, "error");
            }
        } catch (err) {
            showToast(err.message || "An error occurred", "error");
            console.error(err);
        }
    });

    function openRazorpay(orderId, razorpayOrderId, amount) {
        const options = {
            key: RAZORPAY_KEY,
            amount: amount,
            currency: "INR",
            name: "LUXE",
            description: "Order Payment",
            order_id: razorpayOrderId,
            prefill: {
                name: "Test User",
                email: "test@example.com",
                contact: "8848817043",
            },
            handler: async function (response) {
                try {
                    const verifyRes = await fetch("/checkout/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId,
                        }),
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        window.location.href = `/checkout/success?orderId=${orderId}`;
                    } else {
                        showToast(verifyData.message, "error");
                        window.location.href = `/checkout/failure`;
                    }
                } catch (err) {
                    console.error(err);
                    window.location.href = `/checkout/failure`;
                }
            },
            theme: { color: "#000000" },
        };
        const rzp1 = new Razorpay(options);
        rzp1.on("payment.failed", function (response) {
            showToast("Payment Failed", "error");
        });
        rzp1.open();
    }
});
