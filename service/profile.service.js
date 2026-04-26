import PDFDocument from "pdfkit";
import { Types } from "mongoose";
import Address from "../models/address.model.js";

/**
 * @typedef {Object} Address
 * @property {string} fullName
 * @property {number} phone
 * @property {number} pincode
 * @property {string} house
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {boolean} isDefault
 */

/**
 * @param {Address} details
 * @param {string} userId
 * @returns
 */
export const createAddress = async (details, userId) => {
    if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid or missing userId");
    }

    if (!details) {
        throw new Error("Address details are required");
    }
    return await Address.create({
        user: userId,
        fullName: details.fullName,
        phone: details.phone,
        pincode: details.pincode,
        houseNumber: details.house,
        street: details.street,
        city: details.city,
        state: details.state,
        isDefault: details.isDefault === "on" ? true : false,
    });
};

export const generateInvoice = (order, res) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;
    const rightEdge = pageWidth - margin;

    const labelX = margin;
    const valueX = 220;
    let y = margin;

    function paymentMethod(method) {
        if (method === "cod") {
            return "Cash on Delivery";
        }
    }

    const detailRow = (label, value) => {
        doc.font("Helvetica").fontSize(10).fillColor("#555555").text(label, labelX, y);
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000").text(value, valueX, y);
        y += 22;
    };

    doc.font("Helvetica-Bold").fontSize(20).fillColor("#000000").text("LUXE", margin, margin);
    doc.font("Helvetica-Bold").fontSize(20).text("INVOICE", 0, margin, { align: "right" });

    y = margin + 50; // move y down past the header
    detailRow("Invoice Number", `#${order.orderId}`);
    detailRow("Order Date", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
    y += 10;
    detailRow("Payment Method", paymentMethod(order.paymentMethod));
    detailRow("Status", order.orderStatus);

    y += 20;
    doc.moveTo(margin, y).lineTo(rightEdge, y).strokeColor("#cccccc").lineWidth(1).stroke();
    y += 25;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("SHIP TO", labelX, y);
    y += 18;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text(order.shippingAddress.fullName, labelX, y);
    y += 18;
    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    doc.text(`${order.shippingAddress.houseNumber} - ${order.shippingAddress.street}`, labelX, y);
    y += 16;
    doc.text(`${order.shippingAddress.city} - ${order.shippingAddress.pincode}`, labelX, y);
    y += 16;
    doc.text(`Phone: ${order.shippingAddress.phone}`, labelX, y);
    y += 35;

    const colItem = margin;
    const colQty = 320;
    const colUnit = 390;
    const colTotal = 470;
    const rowHeight = 30;

    doc.rect(margin, y, rightEdge - margin, rowHeight)
        .fillColor("#f0ede8")
        .fill();

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
    doc.text("ITEM", colItem + 5, y + 10);
    doc.text("QTY", colQty, y + 10);
    doc.text("UNIT PRICE", colUnit, y + 10);
    doc.text("TOTAL", colTotal, y + 10);

    y += rowHeight;

    order.items.forEach((item) => {
        const itemRowHeight = item.size || item.color ? 45 : 30;

        doc.font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#000000")
            .text(item.productName, colItem + 5, y + 8);

        if (item.size || item.color) {
            const subParts = [];
            if (item.size) subParts.push(`Size: ${item.size}`);
            if (item.color) subParts.push(`Color: ${item.color}`);
            doc.font("Helvetica")
                .fontSize(8)
                .fillColor("#888888")
                .text(subParts.join("  ·  "), colItem + 5, y + 22);
        }

        doc.font("Helvetica").fontSize(10).fillColor("#000000");
        doc.text(String(item.quantity), colQty, y + 8);
        doc.text(`Rs. ${item.price.toFixed(2)}`, colUnit, y + 8);
        doc.font("Helvetica-Bold").text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, colTotal, y + 8);

        // Row bottom border
        doc.moveTo(margin, y + itemRowHeight)
            .lineTo(rightEdge, y + itemRowHeight)
            .strokeColor("#e0ddd8")
            .lineWidth(0.5)
            .stroke();

        y += itemRowHeight;
    });

    y += 25;

    const totalsLabelX = 380;

    const totalRow = (label, value, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(10)
            .fillColor(bold ? "#000000" : "#555555")
            .text(label, totalsLabelX, y);
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").text(`Rs. ${parseFloat(value).toFixed(2)}`, colTotal, y);
        y += 20;
    };

    totalRow("Subtotal", order.subtotal);
    totalRow(`GST`, order.GST);
    totalRow("Shipping", order.shipping);

    y += 5;
    doc.moveTo(totalsLabelX, y).lineTo(rightEdge, y).strokeColor("#333333").lineWidth(0.8).stroke();
    y += 10;

    totalRow("TOTAL", order.total, true);

    doc.end();
};
