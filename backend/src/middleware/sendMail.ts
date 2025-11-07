// backend/src/middlewares/sendMail.ts
import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    service: 'gmail', // or configure custom SMTP
    auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    },
    // allow self-signed local env if explicitly turned off
    tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
});

export default transport;
