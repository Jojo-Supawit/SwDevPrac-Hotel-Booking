const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // If SMTP host is not configured or in development without real SMTP, log to console safely
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
        console.log(`[SIMULATED EMAIL SENT] To: ${options.email} | Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Hotel Booking System'} <${process.env.FROM_EMAIL || 'noreply@hotelbooking.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log(`Message sent: %s`, info.messageId);
    return info;
};

module.exports = sendEmail;
