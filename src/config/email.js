const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify connection configuration
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        logger.info('✅ Email service ready');
        return true;
    } catch (error) {
        logger.error(`❌ Email service error: ${error.message}`);
        return false;
    }
};

module.exports = {
    transporter,
    verifyEmailConnection,
};
