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

    const dateSelect = document.getElementById("date");
    const customDateContainer = document.getElementById("custom-date-container");
    const filterForm = document.getElementById("filterForm");

    dateSelect.addEventListener("change", () => {
        if (dateSelect.value === "custom") {
            customDateContainer.classList.remove("d-none");
        } else {
            customDateContainer.classList.add("d-none");
        }
    });

    filterForm.addEventListener("submit", (e) => {
        if (dateSelect.value === "custom") {
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            const today = new Date().toISOString().split('T')[0];

            if (!startDate || !endDate) {
                e.preventDefault();
                showToast("Please select both a Start Date and End Date.");
            } else if (startDate > today || endDate > today) {
                e.preventDefault();
                showToast("Date cannot be in the future.", "error");
            } else if (startDate > endDate) {
                e.preventDefault();
                showToast("Start date cannot be after end date.", "error");
            }
        }
    });

    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    downloadPdfBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const selectedDateRange = dateSelect.value;
        let downloadUrl = `/admin/sales-report/pdf?date=${selectedDateRange}`;
        if (selectedDateRange === "custom") {
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            downloadUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }
        window.location.href = downloadUrl;
    });

    const downloadExcelBtn = document.getElementById("downloadExcelBtn");
    downloadExcelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const selectedDateRange = dateSelect.value;
        let downloadUrl = `/admin/sales-report/excel?date=${selectedDateRange}`;
        if (selectedDateRange === "custom") {
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            downloadUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }
        window.location.href = downloadUrl;
    });
});
