import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
    to,
    subject,
    html,
    from,
}: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}) => {
    try {
        console.log('[Email] Sending email to:', Array.isArray(to) ? to.join(', ') : to);
        
        const response = await resend.emails.send({
            from: from || process.env.RESEND_FROM_EMAIL || 'Snitch <noreply@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });
        
        console.log('[Email] Sent successfully:', response);
        return response;
    } catch (error) {
        console.error('[Email] Failed to send:', error);
        throw error;
    }
};

export const sendVerificationCode = async (email: string, code: string) => {
    const html = `
        <div style="
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
            color: white;
            text-align: center;
            padding: 40px 20px;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
        ">
            <!-- Logo -->
            <div style="margin-bottom: 20px;">
                <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1e3a8a" />
                            <stop offset="50%" stop-color="#2563eb" />
                            <stop offset="100%" stop-color="#60a5fa" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                        fill="url(#hexGradient)"
                    />
                    <text
                        x="50"
                        y="68"
                        text-anchor="middle"
                        fill="white"
                        font-size="48"
                        font-family="system-ui, -apple-system, sans-serif"
                        font-weight="900"
                    >
                        SNITCH
                    </text>
                </svg>
            </div>

            <h1 style="font-size: 28px; margin-bottom: 10px;">Email Verification</h1>
            <p style="font-size: 16px; opacity: 0.9; margin-bottom: 30px;">
                Please use the code below to verify your Snitch account.
            </p>

            <div style="
                display: inline-block;
                background: white;
                color: #1e3a8a;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 4px;
                padding: 15px 30px;
                border-radius: 8px;
                margin-bottom: 30px;
            ">
                ${code}
            </div>

            <p style="font-size: 14px; opacity: 0.8;">
                This code will expire in 15 minutes. If you didn't request this, please ignore this email.
            </p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject: 'Your Snitch Verification Code',
        html,
    });
};

export const sendPasswordResetCode = async (email: string, code: string) => {
    const html = `
        <div style="
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
            color: white;
            text-align: center;
            padding: 40px 20px;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
        ">
            <!-- Logo -->
            <div style="margin-bottom: 20px;">
                <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1e3a8a" />
                            <stop offset="50%" stop-color="#2563eb" />
                            <stop offset="100%" stop-color="#60a5fa" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                        fill="url(#hexGradient)"
                    />
                    <text
                        x="50"
                        y="68"
                        text-anchor="middle"
                        fill="white"
                        font-size="48"
                        font-family="system-ui, -apple-system, sans-serif"
                        font-weight="900"
                    >
                        SNITCH
                    </text>
                </svg>
            </div>

            <h1 style="font-size: 28px; margin-bottom: 10px;">Password Reset</h1>
            <p style="font-size: 16px; opacity: 0.9; margin-bottom: 30px;">
                You requested to reset your password. Your reset code is:
            </p>

            <div style="
                display: inline-block;
                background: white;
                color: #1e3a8a;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 4px;
                padding: 15px 30px;
                border-radius: 8px;
                margin-bottom: 30px;
            ">
                ${code}
            </div>

            <p style="font-size: 14px; opacity: 0.8;">
                This code will expire in 15 minutes. If you didn't request this, please ignore this email.
            </p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject: 'Snitch Password Reset Code',
        html,
    });
};
