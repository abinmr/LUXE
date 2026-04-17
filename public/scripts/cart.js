async function calculateTotal() {
    try {
        const res = await fetch("/cart/details");
        const { data } = await res.json();
        document.getElementById("subtotal").innerText = data.subtotal;
        document.getElementById("GST").innerText = data.gst;
        document.getElementById("shipping").innerText = data.shipping;
        document.getElementById("total").innerText = data.total;
    } catch (err) {
        console.error("Failed to update pricing:", err);
    }
}

document.querySelectorAll(".cart-item-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", async function () {
        try {
            const res = await fetch(`/cart/toggle-selection/${this.dataset.itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isSelected: this.checked }),
            });
            const data = await res.json();
            if (data.success) calculateTotal();
        } catch (err) {
            console.error("Toggle failed:", err);
        }
    });
});

document.querySelectorAll(".quantityAdd").forEach((addBtn) => {
    const input = addBtn.previousElementSibling;
    addBtn.addEventListener("click", async function () {
        const stock = Number(this.dataset.stock);
        const max = Math.min(stock, 10);
        let val = Number(input.value);

        if (val >= max) {
            addBtn.disabled = true;
            return;
        }

        input.value = val + 1;
        if (val + 1 >= max) addBtn.disabled = true;

        addBtn.previousElementSibling.previousElementSibling.disabled = false;

        try {
            const res = await fetch(`/cart/quantityAdd/${this.dataset.itemId}`);
            if (res.ok) calculateTotal();
        } catch (err) {
            console.error(err);
        }
    });
});

document.querySelectorAll(".quantityMinus").forEach((minusBtn) => {
    const input = minusBtn.nextElementSibling;
    minusBtn.addEventListener("click", async function () {
        let val = Number(input.value);

        if (val <= 1) {
            minusBtn.disabled = true;
            return;
        }

        input.value = val - 1;
        if (val - 1 <= 1) minusBtn.disabled = true;

        input.nextElementSibling.disabled = false;

        try {
            const res = await fetch(`/cart/quantityMinus/${this.dataset.itemId}`);
            if (res.ok) calculateTotal();
        } catch (err) {
            console.error(err);
        }
    });
});

document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
        const itemId = this.dataset.itemId;
        try {
            const res = await fetch(`/cart/delete/${itemId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                document.querySelector(`.cart-item[data-item-id="${itemId}"]`).remove();
                calculateTotal();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    });
});

document.querySelectorAll(".out-of-stock").forEach((btn) => {
    btn.addEventListener("click", () => {
        window.location.reload();
    });
});
