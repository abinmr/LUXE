const selectedDateRange = document.getElementById("date").value;

const downloadPdfBtn = document.getElementById("downloadPdfBtn");
downloadPdfBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const downloadUrl = `/admin/sales-report/pdf?date=${selectedDateRange}`;
    window.location.href = downloadUrl;
});

const downloadExcelBtn = document.getElementById("downloadExcelBtn");
downloadExcelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const downloadUrl = `/admin/sales-report/excel?date=${selectedDateRange}`;
    window.location.href = downloadUrl;
});
