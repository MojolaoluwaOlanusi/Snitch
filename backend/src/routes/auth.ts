// backend/src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../models/User';
import transport from '../middleware/sendMail';
import {doHash, doHashValidation, hmacProcess} from '../utils/hashing';


const router = express.Router();

function signAccess(id:string){ return jwt.sign({ id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '15m' }); }
function signRefresh(id:string){ return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'devrefresh', { expiresIn: '30d' }); }
router.post('/signup', async (req,res)=>{ const { email, username, password, accountType } = req.body; if(!email||!username||!password) return res.status(400).json({ error:'missing' }); const h = await bcrypt.hash(password, 10); try{ const u = await User.create({ email, username, passwordHash: h, displayName: username, accountType }); res.json({ id: u._id }); }catch(e:any){ res.status(400).json({ error: e.message }); } });
router.post('/login', async (req,res)=>{ const { email, password } = req.body; const u = await User.findOne({ email }); if(!u) return res.status(401).json({ error:'invalid' }); const ok = bcrypt.compareSync(password, u.passwordHash!); if(!ok) return res.status(401).json({ error:'invalid' }); if(u.isBanned) return res.status(403).json({ error:'banned' }); const access = signAccess(String(u._id)); const refresh = signRefresh(String(u._id)); res.json({ access, refresh, user: { id: u._id, username: u.username } }); });


/* ---------- SIGNOUT ---------- */
router.post('/signout', (req, res) => {
    // client should delete tokens; if you set cookies you can clear them here
    res.json({ success: true, message: 'Signed out' });
});

/* ---------- SEND VERIFICATION CODE ---------- */
router.post('/send-verification-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        // Save hashed code and timestamp as Date
        user.verificationCode = hmacProcess(code);
        user.verificationCodeValidation = new Date();
        await user.save();

        const html = `<div style="font-family:Arial,sans-serif">
      <h2>Snitch — Verification Code</h2>
      <p>Your verification code is:</p>
      <div style="font-size:28px;font-weight:700">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`;

        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: 'Your Snitch verification code',
            html,
        });

        res.json({ success: true, message: 'Code sent' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------- VERIFY VERIFICATION CODE ---------- */
router.post('/verify-verification-code', async (req, res) => {
    const { email, providedCode } = req.body;
    if (!email || !providedCode) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.verified) return res.status(400).json({ success: false, message: 'Already verified' });
        if (!user.verificationCode || !user.verificationCodeValidation) return res.status(400).json({ success: false, message: 'No code exists, request a new one' });

        const validationTs = user.verificationCodeValidation instanceof Date
            ? user.verificationCodeValidation.getTime()
            : Number(user.verificationCodeValidation);

        if (Date.now() - validationTs > 10 * 60 * 1000) {
            // expired: clear fields
            user.verificationCode = undefined;
            user.verificationCodeValidation = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        const hashedProvided = hmacProcess(String(providedCode));
        if (hashedProvided !== user.verificationCode) return res.status(400).json({ success: false, message: 'Invalid code' });

        user.verified = true;
        user.verificationCode = undefined;
        user.verificationCodeValidation = undefined;
        await user.save();
        return res.json({ success: true, message: 'Account verified' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------- SEND FORGOT PASSWORD CODE ---------- */
router.post('/send-forgot-password-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.forgotPasswordCode = hmacProcess(code);
        user.forgotPasswordCodeValidation = new Date();
        await user.save();

        const html = `<div style="font-family:Arial,sans-serif">
      <h2>Password reset</h2>
      <p>Use the following code to reset your password:</p>
      <div style="font-size:28px;font-weight:700">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`;

        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: 'Your password reset code',
            html,
        });

        res.json({ success: true, message: 'Reset code sent' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------- VERIFY FORGOT PASSWORD CODE + CHANGE PASSWORD ---------- */
router.post('/verify-forgot-password-code', async (req, res) => {
    const { email, providedCode, newPassword } = req.body;
    if (!email || !providedCode || !newPassword) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findOne({ email }).select('+forgotPasswordCode +forgotPasswordCodeValidation +passwordHash');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: 'No reset code exists' });
        }

        const validationTs = user.forgotPasswordCodeValidation instanceof Date
            ? user.forgotPasswordCodeValidation.getTime()
            : Number(user.forgotPasswordCodeValidation);

        if (Date.now() - validationTs > 10 * 60 * 1000) {
            user.forgotPasswordCode = undefined;
            user.forgotPasswordCodeValidation = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        const hashedProvided = hmacProcess(String(providedCode));
        if (hashedProvided !== user.forgotPasswordCode) return res.status(400).json({ success: false, message: 'Invalid code' });

        // change password
        user.passwordHash = await doHash(newPassword, 12);
        user.forgotPasswordCode = undefined;
        user.forgotPasswordCodeValidation = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------- CHANGE PASSWORD (auth required) ---------- */
/* Use the same auth middleware pattern you used elsewhere (token to get userId). */

async function authMiddleware(req: any, res: any, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'unauth' });
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        req.userId = decoded.id;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'invalid' });
    }
}

router.patch('/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing params' });

    try {
        const user = await User.findById((req as any).userId).select('+passwordHash');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const ok = await doHashValidation(oldPassword, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid current password' });

        user.passwordHash = await doHash(newPassword, 12);
        await user.save();

        res.json({ success: true, message: 'Password changed' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
