import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import {User} from '../models/User.js';          // ✅ Added import
import Conversation from '../models/Conversation.js'; // ✅ Added import

const router = express.Router();

// GET /api/sync/updates
// Returns new posts, messages, and notifications since the given timestamp
router.get('/updates', protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;

        // 🔧 Fix: Handle `since` query parameter (could be string or array)
        const sinceParam = req.query.since;
        let since: Date;
        if (typeof sinceParam === 'string') {
            since = new Date(parseInt(sinceParam, 10));
        } else {
            // Default to 24 hours ago
            since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        // Fetch new posts from followed users
        const user = await User.findById(userId).select('following');
        const followedIds = user?.following || [];

        const newPosts = await Post.find({
            author: { $in: followedIds },
            createdAt: { $gt: since },
            isPublished: true,
            visibility: 'Public',
        })
            .populate('author', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(20);

        // Fetch new messages (unread count)
        const conversations = await Conversation.find({ participants: userId });
        let unreadCount = 0;
        for (const conv of conversations) {
            // Safely access unreadCount Map
            const unread = conv.unreadCount?.get(userId) || 0;
            unreadCount += unread;
        }

        // Fetch new notifications
        const newNotifications = await Notification.find({
            to: userId,
            createdAt: { $gt: since },
            read: false,
        })
            .populate('from', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            newPosts,
            unreadCount,
            newNotifications,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;