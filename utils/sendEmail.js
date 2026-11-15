const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // If SMTP host is not configured or in development without real SMTP, log to console safely
    if (!process.env.SMTP_HOST) {
        console.log(`[SIMULATED EMAIL SENT] To: ${options.email} | Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        return { success: true, simulated: true };
    }

    const transportConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true'
    };

    // Include SMTP authentication only when both user and password are provided
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transportConfig.auth = {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);

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
