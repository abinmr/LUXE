const cancelOrderBtn = document.getElementById("cancel-btn");

cancelOrderBtn.addEventListener("click", () => {
    const orderId = cancelOrderBtn.dataset.orderId;
    console.log(orderId);
});
