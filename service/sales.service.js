import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

/**
 * @param {string} date -
 */
export async function getDates(date) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    if (date === "today") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (date === "week") {
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (date === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (date === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return { startDate, endDate };
}

/**
 * @param {import("../types").ReportData} reportData -
 * @param {import('express').Response} res -
 */
export async function generateSalesReportPDF(reportData, res) {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report.pdf`);
    doc.pipe(res);

    const margin = 40;
    const pageWidth = doc.page.width;
    const rightEdge = pageWidth - margin;
    let y = margin;

    // --- HEADER ---
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#000000").text("LUXE", margin, margin);
    doc.font("Helvetica-Bold").fontSize(20).text("SALES REPORT", 0, margin, { align: "right", width: rightEdge });

    y = margin + 40;

    // --- SUMMARY SECTION ---
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#333333").text("Summary", margin, y);

    // Period
    doc.font("Helvetica").fontSize(10).fillColor("#555555").text(`Period: ${reportData.startDate} to ${reportData.endDate}`, 0, y, { align: "right", width: rightEdge });
    y += 20;

    const summaryCol1 = margin;
    const summaryCol2 = margin + 300;

    const detailRow = (label, value, x, currentY) => {
        doc.font("Helvetica").fontSize(10).fillColor("#555555").text(label, x, currentY);
        doc.font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#000000")
            .text(value, x + 100, currentY);
    };

    detailRow("Total Orders:", String(reportData.totalOrders || 0), summaryCol1, y);
    detailRow("Total Revenue:", `Rs. ${Number(reportData.totalRevenue || 0).toFixed(2)}`, summaryCol2, y);
    y += 20;
    detailRow("Total Discount:", `Rs. ${Number(reportData.totalDiscount || 0).toFixed(2)}`, summaryCol1, y);
    detailRow("Net Sales:", `Rs. ${Number(reportData.netSales || 0).toFixed(2)}`, summaryCol2, y);

    y += 40;

    // --- TABLE HEADER ---
    const colDate = margin;
    const colOrderId = margin + 80;
    const colCustomer = margin + 180;
    const colMethod = margin + 330;
    const colGross = margin + 440;
    const colDiscount = margin + 550;
    const colNet = margin + 650;
    const rowHeight = 30;

    const drawTableHeader = () => {
        doc.rect(margin, y, rightEdge - margin, rowHeight)
            .fillColor("#f0ede8")
            .fill();

        doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
        doc.text("DATE", colDate + 5, y + 10);
        doc.text("ORDER ID", colOrderId, y + 10);
        doc.text("CUSTOMER", colCustomer, y + 10);
        doc.text("METHOD", colMethod, y + 10);
        doc.text("GROSS AMT", colGross, y + 10);
        doc.text("DISCOUNT", colDiscount, y + 10);
        doc.text("NET AMT", colNet, y + 10);
        y += rowHeight;
    };

    drawTableHeader();

    // --- TABLE ROWS ---
    if (reportData.orders && reportData.orders.length > 0) {
        reportData.orders.forEach((order) => {
            // Check if we need to add a new page
            if (y > doc.page.height - 50) {
                doc.addPage({ margin: 40, size: "A4", layout: "landscape" });
                y = margin;
                drawTableHeader();
            }

            doc.font("Helvetica").fontSize(9).fillColor("#000000");

            // Format Date
            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
            doc.text(orderDate, colDate + 5, y + 10);

            // Order ID
            doc.text(order.orderId || "N/A", colOrderId, y + 10);

            // Customer Name (Truncate if too long)
            let custName = order.customerName || (order.shippingAddress ? order.shippingAddress.fullName : "N/A");
            if (custName.length > 20) custName = custName.substring(0, 18) + "...";
            doc.text(custName, colCustomer, y + 10);

            // Payment Method
            let method = "N/A";
            if (order.paymentMethod === "cod") method = "COD";
            else if (order.paymentMethod === "razorpay") method = "Razorpay";
            else if (order.paymentMethod === "wallet") method = "Wallet";
            doc.text(method, colMethod, y + 10);

            // Amounts
            const grossAmt = order.subtotal || order.total || 0;
            const discountAmt = (order.couponDiscount || 0) + (order.offerDiscount || 0) || 0;
            const netAmt = order.total || 0;

            doc.text(`Rs. ${Number(grossAmt).toFixed(2)}`, colGross, y + 10);
            doc.text(`Rs. ${Number(discountAmt).toFixed(2)}`, colDiscount, y + 10);
            doc.font("Helvetica-Bold").text(`Rs. ${Number(netAmt).toFixed(2)}`, colNet, y + 10);

            // Row bottom border
            doc.moveTo(margin, y + rowHeight)
                .lineTo(rightEdge, y + rowHeight)
                .strokeColor("#e0ddd8")
                .lineWidth(0.5)
                .stroke();

            y += rowHeight;
        });
    } else {
        // No orders message
        doc.font("Helvetica").fontSize(10).fillColor("#888888");
        doc.text("No orders found for the selected period.", margin, y + 15, { align: "center", width: rightEdge - margin });
    }

    doc.end();
}

export async function generateSalesReportExcel(reportData, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Header styling
    worksheet.mergeCells('A1', 'G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LUXE - SALES REPORT';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Summary
    worksheet.getCell('A3').value = `Period: ${reportData.startDate} to ${reportData.endDate}`;
    worksheet.getCell('A3').font = { bold: true };

    worksheet.getCell('A5').value = 'Total Orders:';
    worksheet.getCell('B5').value = reportData.totalOrders || 0;
    
    worksheet.getCell('D5').value = 'Total Revenue:';
    worksheet.getCell('E5').value = `Rs. ${Number(reportData.totalRevenue || 0).toFixed(2)}`;

    worksheet.getCell('A6').value = 'Total Discount:';
    worksheet.getCell('B6').value = `Rs. ${Number(reportData.totalDiscount || 0).toFixed(2)}`;

    worksheet.getCell('D6').value = 'Net Sales:';
    worksheet.getCell('E6').value = `Rs. ${Number(reportData.netSales || 0).toFixed(2)}`;

    // Make summary labels bold
    ['A5', 'D5', 'A6', 'D6'].forEach(cell => {
        worksheet.getCell(cell).font = { bold: true };
    });

    // Table Headers
    worksheet.getRow(8).values = [
        'DATE', 'ORDER ID', 'CUSTOMER', 'METHOD', 'GROSS AMT', 'DISCOUNT', 'NET AMT'
    ];
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).alignment = { horizontal: 'center' };

    // Table Data
    let currentRow = 9;
    if (reportData.orders && reportData.orders.length > 0) {
        reportData.orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
            
            let custName = order.customerName || (order.shippingAddress ? order.shippingAddress.fullName : "N/A");
            
            let method = "N/A";
            if (order.paymentMethod === "cod") method = "COD";
            else if (order.paymentMethod === "razorpay") method = "Razorpay";
            else if (order.paymentMethod === "wallet") method = "Wallet";

            const grossAmt = order.subtotal || order.total || 0;
            const discountAmt = (order.couponDiscount || 0) + (order.offerDiscount || 0) || 0;
            const netAmt = order.total || 0;

            worksheet.getRow(currentRow).values = [
                orderDate,
                order.orderId || "N/A",
                custName,
                method,
                grossAmt,
                discountAmt,
                netAmt
            ];
            currentRow++;
        });
    } else {
        worksheet.mergeCells(`A${currentRow}`, `G${currentRow}`);
        const noDataCell = worksheet.getCell(`A${currentRow}`);
        noDataCell.value = 'No orders found for the selected period.';
        noDataCell.alignment = { horizontal: 'center' };
    }

    // Set column widths
    worksheet.columns = [
        { width: 15 }, // Date
        { width: 20 }, // Order ID
        { width: 25 }, // Customer
        { width: 15 }, // Method
        { width: 15 }, // Gross Amt
        { width: 15 }, // Discount
        { width: 15 }  // Net Amt
    ];

    // Response Headers
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.xlsx"
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
}
