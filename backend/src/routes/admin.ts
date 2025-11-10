import express from 'express';
import { User } from '../models/User.ts';
import Warning from '../models/Warning.ts';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 🔹 Authentication Middleware
async function auth(req: any, res: any, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'unauth' });

    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        req.userId = decoded.id;
        const u = await User.findById(req.userId);
        if (!u) return res.status(401).json({ error: 'unauth' });
        req.user = u;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'invalid' });
    }
}

// 🔹 Require Admin Middleware
function requireAdmin(req: any, res: any, next: any) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'forbidden' });
    }
    next();
}

// 🔹 Warn a User
router.post('/warn/:userId', auth, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const w = await Warning.create({
        userId,
        issuedBy: req.userId,
        reason,
        createdAt: new Date()
    });

    const u = await User.findByIdAndUpdate(
        userId,
        { $inc: { warningsCount: 1 } },
        { new: true }
    );

    if (u && u.warningsCount >= 3 && !u.isBanned) {
        u.isBanned = true;
        await u.save();
    }

    try {
        const io = (globalThis as any).io;
        if (io) io.emit('user:warned', { userId, warnings: u ? u.warningsCount : 0 });
    } catch (e) {}

    res.json({ ok: true, warning: w });
});

// 🔹 Get All Warnings
router.get('/warnings', auth, requireAdmin, async (req, res) => {
    const warnings = await Warning.find()
        .populate('userId', 'email username')
        .populate('issuedBy', 'email username')
        .sort({ createdAt: -1 });
    res.json(warnings);
});

// 🔹 Get All Banned Users
router.get('/users/banned', auth, requireAdmin, async (req, res) => {
    const bannedUsers = await User.find({ isBanned: true }, 'email username warningsCount');
    res.json(bannedUsers);
});

// 🔹 Get All Users
router.get('/users', auth, requireAdmin, async (req, res) => {
    const users = await User.find({}, 'email username warningsCount isBanned isAdmin');
    res.json(users);
});

// 🔹 Unban a User
router.patch('/unban/:userId', auth, requireAdmin, async (req, res) => {
    const { userId } = req.params;

    const u = await User.findById(userId);
    if (!u) return res.status(404).json({ error: 'User not found' });

    if (!u.isBanned) return res.status(400).json({ error: 'User is not banned' });

    u.isBanned = false;
    u.warningsCount = 0; // Optional reset
    await u.save();

    try {
        const io = (globalThis as any).io;
        if (io) io.emit('user:unbanned', { userId });
    } catch (e) {}

    res.json({ ok: true, message: 'User has been unbanned', user: u });
});


// 🔹 NEW: Manually Ban a User
router.patch('/ban/:userId', auth, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const u = await User.findById(userId);
    if (!u) return res.status(404).json({ error: 'User not found' });

    if (u.isBanned) return res.status(400).json({ error: 'User already banned' });

    u.isBanned = true;
    await u.save();

    // Optionally record a system-level warning
    if (reason) {
        await Warning.create({
            userId,
            issuedBy: req.userId,
            reason: reason || 'Manual ban by admin',
            createdAt: new Date(),
        });
    }

    try {
        const io = (globalThis as any).io;
        if (io) io.emit('user:banned', { userId, reason });
    } catch (e) {}

    res.json({ ok: true, message: 'User has been manually banned', user: u });
});

// 🔹 Get all warnings for a specific user
router.get('/warnings/:userId', auth, requireAdmin, async (req, res) => {
    const { userId } = req.params;

    // Find warnings issued to this user
    const warnings = await Warning.find({ userId })
        .populate('issuedBy', 'email username')
        .sort({ createdAt: -1 });

    if (!warnings.length) {
        return res.status(404).json({ error: 'No warnings found for this user' });
    }

    res.json({
        userId,
        count: warnings.length,
        warnings
    });
});

// 🔹 Public route — List all admins
router.get('/admins', async (req, res) => {
    try {
        // Find all users with isAdmin true
        const admins = await User.find(
            { isAdmin: true },
            'username email createdAt'
        ).sort({ createdAt: -1 });

        res.json({ count: admins.length, admins });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Generate a six-digit admin invite code (expires in 15 minutes)
// POST /api/admin/generate-invite  { email (optional), expiresMinutes: number }
router.post('/generate-invite', auth, requireAdmin, async (req,res)=>{
    const expiresMinutes = Number(req.body.expiresMinutes) || 15;
    const targetEmail = req.body.email || null; // optional - email to tie code to
    const code = String(Math.floor(100000 + Math.random()*900000)); // 6 digits
    const hash = crypto.createHmac('sha256', process.env.HMAC_VERIFICATION_CODE_SECRET || 'devsecret')
        .update(code).digest('hex');
    // store invite as subdocument on admin user or a tiny collection; simplest: store on issuing admin user
    const invite = {
        codeHash: hash,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
        issuedBy: req.userId,
        targetEmail,
    };
    // ensure req.user exists
    (req.user as any).adminInvite = invite;
    await (req.user as any).save();
    // return raw code to admin (they will share it)
    res.json({ ok: true, code, expiresAt: invite.expiresAt });
});

// Accept an invite: POST /api/admin/accept-invite { email, code }
// If code matches any active invite stored on some admin user and (optional) email matches, set that user isAdmin=true
router.post('/accept-invite', auth, async (req,res)=>{
    const { code } = req.body;
    if(!code) return res.status(400).json({ error:'missing_code' });

    // iterate admin users with non-expired invites
    const admins = await User.find({ isAdmin: true, 'adminInvite.expiresAt': { $gt: new Date() } });
    const codeHash = crypto.createHmac('sha256', process.env.HMAC_VERIFICATION_CODE_SECRET || 'devsecret')
        .update(String(code)).digest('hex');

    // find matching invite (simple approach)
    let matchedAdmin:any = null;
    for(const a of admins){
        const inv:any = (a as any).adminInvite;
        if(!inv) continue;
        if(inv.codeHash === codeHash && inv.expiresAt > new Date()){
            matchedAdmin = a;
            break;
        }
    }
    if(!matchedAdmin) return res.status(404).json({ error:'invalid_or_expired_code' });

    // set current user as admin
    const me = await User.findById(req.userId);
    if(!me) return res.status(404).json({ error:'user_not_found' });
    me.isAdmin = true;
    // clear invites on matched admin (optional)
    matchedAdmin.adminInvite = undefined;
    await matchedAdmin.save();
    await me.save();
    res.json({ ok: true, message: 'You are now an admin' });
});


// @ts-ignore
export default router;
