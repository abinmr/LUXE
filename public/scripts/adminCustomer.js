window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollPosition", window.scrollY);
});

window.addEventListener("DOMContentLoaded", () => {
    const savedScrollPosition = sessionStorage.getItem("scrollPosition");

    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition));

        sessionStorage.removeItem("scrollPosition");
        const searchInput = document.getElementById("searchCustomer");
        if (searchInput && searchInput.value.length > 0) {
            const textLength = searchInput.value.length;
            searchInput.setSelectionRange(textLength, textLength);
        }
    }

    const customerStatusBtn = document.querySelectorAll(".customer-status");
    customerStatusBtn.forEach((btn) => {
        btn.addEventListener("click", async function () {
            const itemId = this.dataset.itemId;
            const btnText = this.textContent.trim().toLowerCase();
            const badge = document.querySelector(`.badge-btn[data-item-id="${itemId}"]`);
            console.log(badge);
            if (btnText === "block customer") {
                const response = await fetch(`/admin/customers/block/${itemId}`, { method: "PATCH" });
                const data = await response.json();
                if (data.success) {
                    this.textContent = "Unblock Customer";
                    badge.textContent = "Blocked";
                    badge.classList.replace("btn-dark", "btn-danger");
                }
            } else if (btnText === "unblock customer") {
                const response = await fetch(`/admin/customers/unblock/${itemId}`, { method: "PATCH" });
                const data = await response.json();
                if (data.success) {
                    this.textContent = "Block Customer";
                    badge.textContent = "Active";
                    badge.classList.replace("btn-danger", "btn-dark");
                }
            }
        });
    });
});

const customerStatus = document.getElementById("customerStatus");
const savedScrollPosition = sessionStorage.getItem("scrollPosition");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchCustomer");
searchForm.addEventListener("change", () => {
    searchForm.submit();
});
searchInput.addEventListener("input", () => {
    if (searchInput.value.length === 0) {
        searchForm.submit();
        // searchInput.focus();
    }
});
