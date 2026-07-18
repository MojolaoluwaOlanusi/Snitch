import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import Warning from '../models/Warning.js';
import Report from '../models/Report.js';
import Post from '../models/Post.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const router = express.Router();

// 🔹 Authentication Middleware
async function auth(req: Request, res: Response, next: any) {
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
        console.log(`There is an error: ${e}`)
        return res.status(401).json({ error: 'invalid' });
    }
}

// 🔹 Require Admin Middleware
function requireAdmin(req: Request, res: Response, next: any) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'forbidden' });
    }
    next();
}

// 🔹 Warn a User
router.post('/warn/:userId', auth, requireAdmin, async (req: Request, res: Response) => {
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
    } catch (e) {
        console.log(e)
    }

    res.json({ ok: true, warning: w });
});

// 🔹 Get All Warnings
router.get('/warnings', auth, requireAdmin, async (_req: Request, res: Response) => {
    const warnings = await Warning.find()
        .populate('userId', 'email username')
        .populate('issuedBy', 'email username')
        .sort({ createdAt: -1 });
    res.json(warnings);
});

// 🔹 Get All Banned Users
router.get('/users/banned', auth, requireAdmin, async (_req: Request, res: Response) => {
    const bannedUsers = await User.find({ isBanned: true }, 'email username warningsCount');
    res.json(bannedUsers);
});

// 🔹 Get All Users
router.get('/users', auth, requireAdmin, async (_req: Request, res: Response) => {
    const users = await User.find({}, 'email username warningsCount isBanned isAdmin');
    res.json(users);
});

router.get('/posts', auth, requireAdmin, async (_req: Request, res: Response) => {
    const posts = await Post.find({},);
    res.json(posts);
});

router.get('/reports', auth, requireAdmin, async (_req: Request, res: Response) => {
    const reports = await Report.find()
        .populate('reason')
        .populate('reportedBy', 'username')
        .populate('postId', 'text')
        .populate('createdAt')
    res.json(reports);
});

// 🔹 Get A User by Username
router.get('/user-by-username', auth, requireAdmin, async (req: Request, res: Response) => {
    const { username } = req.body;
    const users = await User.findOne({username}, 'email username warningsCount isBanned isAdmin');
    res.json(users);
});

// 🔹 Delete A User
router.delete('/delete-user/:id', auth, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid User Id" });
    }

    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err: any) {
        console.log("error in deleting User:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
})

// 🔹 Unban a User
router.patch('/unban/:userId', auth, requireAdmin, async (req: Request, res: Response) => {
    const { userId } = req.params;

    const u = await User.findById(userId).select("-passwordHash");
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
router.patch('/ban/:userId', auth, requireAdmin, async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const u = await User.findById(userId).select("-passwordHash");
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
router.get('/warnings/:userId', auth, requireAdmin, async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Find warnings issued to this user
    const warnings = await Warning.find({ userId })
        .populate('issuedBy', 'email username')
        .sort({ createdAt: -1 });

    if (!warnings.length) {
        return res.status(200).json({ message: 'No warnings found for this user' });
    }

    res.json({
        userId,
        count: warnings.length,
        warnings
    });
});

// 🔹 Public route — List all admins
router.get('/admins', async (_req: Request, res: Response) => {
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
router.post('/generate-invite', auth, requireAdmin, async (req: Request, res: Response)=>{
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

// Accept an invitation: POST /api/admin/accept-invite { email, code }
// If code matches any active invite stored on some admin user and (optional) email matches, set that user isAdmin=true
router.post('/accept-invite', auth, async (req: Request, res: Response)=>{
    const { code } = req.body;
    if(!code) return res.status(400).json({ error:'missing_code', message: "Please enter a code" });

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
    if(!matchedAdmin) return res.status(401).json({ error:'invalid_or_expired_code', message: 'Invalid or expired code', });

    // set current user as admin
    const me = await User.findById(req.userId);
    if(!me) return res.status(401).json({ error:'user_not_found', message: "This user does not exist" });
    me.isAdmin = true;
    // clear invites on matched admin (optional)
    matchedAdmin.adminInvite = undefined;
    await matchedAdmin.save();
    await me.save();
    res.json({ ok: true, message: 'You are now an admin' });
});

// GET /api/admin/stats/users – new users per month for the last 12 months
router.get('/stats/users', auth, requireAdmin, async (_req: Request, res: Response) => {
    const stats = await User.aggregate([
        { $match: { createdAt: { $exists: true } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    res.json(stats);
});

// GET /api/admin/stats/posts
router.get('/stats/posts', auth, requireAdmin, async (_req: Request, res: Response) => {
    const stats = await Post.aggregate([
        { $match: { createdAt: { $exists: true } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    res.json(stats);
});

// GET /api/admin/stats/reports
router.get('/stats/reports', auth, requireAdmin, async (_req: Request, res: Response) => {
    const stats = await Report.aggregate([
        { $match: { createdAt: { $exists: true } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    res.json(stats);
});

// @ts-ignore
export default router;
