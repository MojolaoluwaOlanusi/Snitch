import Notification from "../models/Notification.ts";
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

async function authMiddleware(req: any, res: any, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'unauth' });
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        req.userId = decoded.id;
        // Also set a user object for convenience (optional)
        req.user = { _id: decoded.id };
        next();
    } catch (e) {
        console.log(`An exception occured: ${e}`);
        return res.status(401).json({ error: 'invalid' });
    }
}

router.get('/get-notifications', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;  // ← use req.userId, not req.user._id

        const notifications = await Notification.find({ to: userId })
            .populate("from", "username displayName avatarUrl")
            .populate("conversationId", "_id")
            .sort({ createdAt: -1 });

        await Notification.updateMany({ to: userId }, { read: true });

        res.status(200).json(notifications);
    } catch (err: any) {
        console.log("Error in getNotifications function", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/delete-notification', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        await Notification.deleteMany({ to: userId });

        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (err: any) {
        console.log("Error in deleteNotifications function", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;