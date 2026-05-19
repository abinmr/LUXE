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
    const retryBtn = document.getElementById("retry-btn");

    retryBtn.addEventListener("click", async () => {
        const orderId = retryBtn.dataset.id;
        try {
            const res = await fetch(`/checkout/retry-payment/${orderId}`);
            const data = await res.json();

            if (!data.success) {
                return showToast(data.message);
            }

            const options = {
                key: data.razorpayKeyId,
                amount: data.amount,
                currency: "INR",
                name: "LUXE",
                description: "Retry Payment",
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch(`/checkout/verify-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderId,
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            window.location.href = `/checkout/success?orderId=${orderId}`;
                        } else {
                            showToast("Payment verification failed", "error");
                        }
                    } catch (err) {
                        console.error(err);
                    }
                },
            };

            const rzp = new Razorpay(options);
            rzp.on("payment.failed", function (response) {
                showToast("Payment failed again.");
            });
            rzp.open();
        } catch (err) {
            console.error(err);
        }
    });
});
