window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollPosition", window.scrollY);
});

window.addEventListener("DOMContentLoaded", () => {
    const savedScrollPosition = sessionStorage.getItem("scrollPosition");

    if (savedScrollPosition) {
        // Scroll to the saved position instantly
        window.scrollTo(0, parseInt(savedScrollPosition));

        sessionStorage.removeItem("scrollPosition");
        const searchInput = document.getElementById("searchCustomer");
        if (searchInput && searchInput.value.length > 0) {
            // Move the cursor to the exact end of the text
            const textLength = searchInput.value.length;
            searchInput.setSelectionRange(textLength, textLength);
        }
    }
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
// const customerStatus = document.getElementById("customerStatus");
// customerStatus.addEventListener("change", () => {
//     const selectedValue = this.value;

//     fetch("/admin/customers/filter", {
//         method: "post",
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ choice: selectedValue })
//     })
// });
