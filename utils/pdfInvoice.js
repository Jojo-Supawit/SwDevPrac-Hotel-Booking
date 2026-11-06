const PDFDocument = require('pdfkit');

/**
 * Generate a formatted PDF Tax Invoice / Receipt and pipe directly to writable stream
 * @param {Object} booking Populated booking object (with hotel and user)
 * @param {Stream} res Writable stream (e.g. Express response)
 */
const generateInvoicePDF = (booking, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream directly to response
    doc.pipe(res);

    const hotel = booking.hotel || {};
    const user = booking.user || {};
    const pricePerNight = hotel.pricePerNight || 1500;
    const nights = booking.nights || 1;
    const taxId = hotel.taxId || '0105559876543';

    // Financial calculations
    const roomCharge = nights * pricePerNight;
    const serviceCharge = Math.round(roomCharge * 0.10 * 100) / 100;
    const subtotalWithService = roomCharge + serviceCharge;
    const vat = Math.round(subtotalWithService * 0.07 * 100) / 100;
    const totalAmount = Math.round((subtotalWithService + vat) * 100) / 100;

    const checkInStr = booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : 'N/A';
    const checkOutStr = booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split('T')[0] : 'N/A';
    const invoiceDateStr = new Date().toISOString().split('T')[0];

    // --- Header ---
    doc.fillColor('#1a365d')
       .fontSize(22)
       .text(hotel.name || 'Hotel Booking System', 50, 45);

    doc.fillColor('#4a5568')
       .fontSize(9)
       .text(`${hotel.address || ''}, ${hotel.district || ''}, ${hotel.province || ''} ${hotel.postalcode || ''}`, 50, 75)
       .text(`Tel: ${hotel.tel || 'N/A'} | Tax ID: ${taxId}`, 50, 88);

    doc.fillColor('#2b6cb0')
       .fontSize(16)
       .text('TAX INVOICE / RECEIPT', 360, 45, { align: 'right' });

    doc.fillColor('#718096')
       .fontSize(9)
       .text('(ORIGINAL)', 360, 65, { align: 'right' })
       .text(`Invoice No: ${booking.transactionRef || booking._id}`, 360, 78, { align: 'right' })
       .text(`Date: ${invoiceDateStr}`, 360, 91, { align: 'right' });

    doc.moveTo(50, 115).lineTo(560, 115).strokeColor('#cbd5e0').stroke();

    // --- Bill To & Stay Details ---
    const customerTop = 130;
    doc.fillColor('#2d3748')
       .fontSize(11)
       .text('BILL TO:', 50, customerTop);

    doc.fillColor('#4a5568')
       .fontSize(10)
       .text(`Guest Name: ${user.name || 'Guest'}`, 50, customerTop + 18)
       .text(`Email: ${user.email || 'N/A'}`, 50, customerTop + 33)
       .text(`Tel: ${user.tel || 'N/A'}`, 50, customerTop + 48);

    doc.fillColor('#2d3748')
       .fontSize(11)
       .text('STAY DETAILS:', 340, customerTop);

    doc.fillColor('#4a5568')
       .fontSize(10)
       .text(`Check-In: ${checkInStr}`, 340, customerTop + 18)
       .text(`Check-Out: ${checkOutStr}`, 340, customerTop + 33)
       .text(`Duration: ${nights} Night(s)`, 340, customerTop + 48)
       .text(`Status: ${booking.status || 'Completed'}`, 340, customerTop + 63);

    // --- Table Header ---
    const tableTop = 230;
    doc.rect(50, tableTop, 510, 22).fill('#edf2f7');

    doc.fillColor('#2d3748')
       .fontSize(10)
       .text('Item Description', 60, tableTop + 6)
       .text('Nights', 320, tableTop + 6, { width: 50, align: 'center' })
       .text('Rate / Night', 380, tableTop + 6, { width: 80, align: 'right' })
       .text('Amount (THB)', 470, tableTop + 6, { width: 80, align: 'right' });

    // --- Table Row ---
    const rowTop = tableTop + 28;
    doc.fillColor('#4a5568')
       .fontSize(10)
       .text(`Room Accommodation (${checkInStr} to ${checkOutStr})`, 60, rowTop)
       .text(`${nights}`, 320, rowTop, { width: 50, align: 'center' })
       .text(`${pricePerNight.toFixed(2)}`, 380, rowTop, { width: 80, align: 'right' })
       .text(`${roomCharge.toFixed(2)}`, 470, rowTop, { width: 80, align: 'right' });

    doc.moveTo(50, rowTop + 25).lineTo(560, rowTop + 25).strokeColor('#e2e8f0').stroke();

    // --- Cost Breakdown Summary ---
    const summaryTop = rowTop + 40;
    const labelX = 350;
    const valueX = 470;
    const colWidth = 80;

    doc.fillColor('#4a5568')
       .fontSize(10)
       .text('Room Charge (Net):', labelX, summaryTop)
       .text(`${roomCharge.toFixed(2)}`, valueX, summaryTop, { width: colWidth, align: 'right' });

    doc.text('Service Charge (10%):', labelX, summaryTop + 18)
       .text(`${serviceCharge.toFixed(2)}`, valueX, summaryTop + 18, { width: colWidth, align: 'right' });

    doc.text('Value-Added Tax (VAT 7%):', labelX, summaryTop + 36)
       .text(`${vat.toFixed(2)}`, valueX, summaryTop + 36, { width: colWidth, align: 'right' });

    doc.rect(340, summaryTop + 54, 220, 26).fill('#ebf8ff');

    doc.fillColor('#2b6cb0')
       .fontSize(11)
       .text('Total Amount (THB):', labelX, summaryTop + 61)
       .text(`${totalAmount.toFixed(2)}`, valueX, summaryTop + 61, { width: colWidth, align: 'right' });

    // --- Footer & Signature ---
    const footerTop = 500;
    doc.fillColor('#718096')
       .fontSize(9)
       .text('Thank you for choosing our hotel!', 50, footerTop)
       .text('This is an official computer-generated Tax Invoice / Receipt.', 50, footerTop + 14)
       .text(`Transaction Reference: ${booking.transactionRef || booking._id}`, 50, footerTop + 28);

    doc.moveTo(380, footerTop + 45).lineTo(530, footerTop + 45).strokeColor('#a0aec0').stroke();
    doc.fillColor('#718096')
       .fontSize(9)
       .text('Authorized Signature', 380, footerTop + 52, { width: 150, align: 'center' });

    doc.end();
};

module.exports = { generateInvoicePDF };
