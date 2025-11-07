import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from "path";
import {fileURLToPath} from 'url';
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });


console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✔️ Loaded" : "❌ Missing");


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

(async () => {
    try {
        await transporter.verify();
        console.log('✅ Email server connected successfully!');
    } catch (error) {
        console.error('❌ Email server error:', error);
    }
})();
