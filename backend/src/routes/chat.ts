import express, { Request, Response } from "express";
import {User} from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { Sticker } from '../models/Sticker.js';
import Contact from "../models/Contact.js";
import { Wallpaper } from '../models/UserWallpaper.js';
import bcrypt from 'bcryptjs';
import {protectRoute} from "../middleware/protectRoute.js";
import {getCachedMessages, redis, updateCachedMessage} from '../utils/redisCache.js';
import { ThemeColor } from '../models/ThemeColor.js';
import axios from 'axios';
import {randomUUID} from 'crypto';
import * as cheerio from 'cheerio';
// Declare global io type so TypeScript knows it exists
declare global {
    var io: any;
}

const router = express.Router();

// Translate message text
router.post("/translate", protectRoute, async (req: Request, res: Response) => {
    try {
        const { text, targetLang } = req.body;
        if (!text) return res.status(400).json({ error: "Text required" });

        const response = await axios.get(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang || 'en'}&dt=t&q=${encodeURIComponent(text)}`
        );
        const translated = response.data[0][0][0];
        res.json({ translated });
    } catch (error: any) {
        console.error("Translation error:", error.message);
        res.status(500).json({ error: "Translation failed" });
    }
});

// Get all conversations for a user
router.get("/conversations", protectRoute, async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("lastMessage")
            .populate("admin", "username displayName avatarUrl lastSeen")
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get or create conversation with a user
router.post("/conversation/:userId", protectRoute, async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] },
            isGroup: false,
        })
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("lastMessage");

        if (!conversation) {
            const inviteToken = randomUUID();

            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                isGroup: false,
                inviteToken: inviteToken,
            });
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "username displayName avatarUrl lastSeen")
                .populate("lastMessage");
        }

        // Auto-add to contacts for both users
        await Contact.findOneAndUpdate(
            { userId: currentUserId, contactId: targetUserId },
            { userId: currentUserId, contactId: targetUserId },
            { upsert: true }
        );
        await Contact.findOneAndUpdate(
            { userId: targetUserId, contactId: currentUserId },
            { userId: targetUserId, contactId: currentUserId },
            { upsert: true }
        );

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages in a conversation
router.get("/messages/:conversationId", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;

        // Try cache first
        try {
            const cached = await getCachedMessages(conversationId);
            if (cached.length > 0) {
                return res.json(cached.reverse());
            }
        } catch (cacheErr) {
            console.warn('Redis cache failed, falling back to MongoDB:', cacheErr);
        }

        // In GET /messages/:conversationId
        const conversation = await Conversation.findById(conversationId);
        if (conversation?.disappearingTimer) {
            const cutoff = new Date(Date.now() - conversation.disappearingTimer * 1000);
            await Message.deleteMany({
                conversationId,
                createdAt: { $lt: cutoff }
            });
        }

        // Build MongoDB query
        const query: any = { conversationId };
        if (before) {
            query._id = { $lt: before };
        }

        const messages = await Message.find(query)
            .populate("senderId", "username displayName avatarUrl lastSeen")
            .populate("replyTo")
            .populate("mentions", "username displayName avatarUrl lastSeen")
            .sort({ createdAt: 1 }) // oldest first
            .limit(Number(limit));

        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Search messages
router.get("/search/:conversationId", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { q } = req.query;

        const messages = await Message.find({
            conversationId,
            text: { $regex: q, $options: "i" },
            deletedAt: null,
        })
            .populate("senderId", "username displayName avatarUrl lastSeen")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Star/Unstar message
router.put("/message/:messageId/star", protectRoute, async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        const isStarred = message.starredBy?.some((id: any) => id.toString() === userId.toString());
        if (isStarred) {
            message.starredBy = message.starredBy.filter((id: any) => id.toString() !== userId.toString());
        } else {
            (message.starredBy as any[]).push(userId as any);
        }

        await message.save();

        // Fetch the fully populated message for Redis caching
        const populated = await Message.findById(messageId)
            .populate('senderId', 'username displayName avatarUrl')
            .populate('replyTo')
            .populate('mentions', 'username displayName avatarUrl');

        // Update Redis cache with the populated message
        if (message.conversationId) {
            await updateCachedMessage(
                message.conversationId.toString(),
                messageId,
                populated
            ).catch(err => console.error('Redis update (star message) error:', err));
        }
        res.json({ starred: !isStarred });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get starred messages
router.get("/starred/:conversationId", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({
            conversationId,
            starredBy: userId,
            deletedAt: null,
        })
            .populate("senderId", "username displayName avatarUrl lastSeen")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get bookmarked messages
router.get("/bookmarked/:conversationId", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({
            conversationId,
            bookmarkedBy: userId,
            deletedAt: null,
        })
            .populate("senderId", "username displayName avatarUrl lastSeen")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Pin/Unpin conversation
router.put("/conversation/:conversationId/pin", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const isPinned = conversation.pinnedBy?.includes(userId);
        if (isPinned) {
            conversation.pinnedBy = conversation.pinnedBy.filter((id: any) => id.toString() !== userId.toString());
        } else {
            conversation.pinnedBy.push(userId);
        }

        await conversation.save();
        res.json({ pinned: !isPinned });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Archive/Unarchive conversation
router.put("/conversation/:conversationId/archive", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const isArchived = conversation.archivedBy?.includes(userId);
        if (isArchived) {
            conversation.archivedBy = conversation.archivedBy.filter((id: any) => id.toString() !== userId.toString());
        } else {
            conversation.archivedBy.push(userId);
        }

        await conversation.save();
        res.json({ archived: !isArchived });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Mute/Unmute conversation
router.put("/conversation/:conversationId/mute", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { duration } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const existingMute = conversation.mutedBy?.find((m: any) => m.user.toString() === userId.toString());
        if (existingMute) {
            conversation.mutedBy = conversation.mutedBy.filter((m: any) => m.user.toString() !== userId.toString());
        } else {
            const until = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : undefined;
            conversation.mutedBy.push({ user: userId, until });
        }

        await conversation.save();
        res.json({ muted: !existingMute });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Mark conversation as read
router.put("/conversation/:conversationId/read", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const unreadMessages = await Message.find({
            conversationId,
            senderId: { $ne: userId },
            [`readAt.${userId}`]: { $exists: false },
        });

        await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                [`readAt.${userId}`]: { $exists: false },
            },
            {
                $set: {
                    [`readAt.${userId}`]: new Date(),
                    status: "read",
                },
            }
        );

        for (const msg of unreadMessages) {
            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl lastSeen');

            if (populated) {
                await updateCachedMessage(conversationId, msg._id.toString(), populated)
                    .catch(err => console.error('Redis update (REST read) error:', err?.message));
            }

            if ((globalThis as any).io) {
                const senderId = msg.senderId.toString();
                const senderSocket = Array.from((globalThis as any).io.sockets.sockets.values())
                    .find((s: any) => s.data?.userId === senderId) as any;
                if (senderSocket) {
                    senderSocket.emit('message:read', { messageId: msg._id, userId });
                }
            }
        }

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            conversation.unreadCount.set(userId.toString(), 0);
            await conversation.save();
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Clear chat
router.delete("/conversation/:conversationId/clear", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            {
                conversationId,
                $or: [{ senderId: userId }, { receiverId: userId }],
            },
            { deletedAt: new Date() }
        );

        try {
            const key = `chat:${conversationId}:messages`;
            await redis.del(key);
        } catch (redisErr) {
            console.warn('Redis clear cache failed:', redisErr);
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Create group chat
router.post("/group", protectRoute, async (req: Request, res: Response) => {
    try {
        const { name, participantIds, avatar, description } = req.body;
        const adminId = req.user._id;

        const avatarColors = [
            'from-blue-400 to-blue-500',
            'from-blue-500 to-blue-600',
            'from-indigo-400 to-indigo-500',
            'from-cyan-400 to-cyan-500',
            'from-sky-400 to-sky-500',
            'from-blue-600 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-blue-400 to-indigo-400',
        ];



        const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

        const inviteToken = randomUUID();

        const conversation = await Conversation.create({
            participants: [adminId, ...participantIds],
            isGroup: true,
            groupName: name,
            groupAvatar: avatar,
            groupDescription: description,
            admin: adminId,
            avatarColor: randomColor, // <-- store the color
            inviteToken: inviteToken,
        });

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        res.json(populatedConversation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add participant to group
router.put("/group/:conversationId/add", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { participantIds } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (conversation.admin?.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only admin can add participants" });
        }

        conversation.participants.push(...participantIds);
        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        res.json(populatedConversation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Remove participant from group
router.put("/group/:conversationId/remove", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { participantId } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (conversation.admin?.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only admin can remove participants" });
        }

        conversation.participants = conversation.participants.filter(
            (id: any) => id.toString() !== participantId.toString()
        );
        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        res.json(populatedConversation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update group info
router.put("/group/:conversationId", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { name, avatar, description, groupAvatar, adminOnlyMessages } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (conversation.admin?.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only admin can update group info" });
        }

        if (name) conversation.groupName = name;
        if (avatar) conversation.groupAvatar = avatar;
        if (description) conversation.groupDescription = description;
        if (groupAvatar) conversation.groupAvatar = groupAvatar;
        conversation.adminOnlyMessages = adminOnlyMessages;

        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        res.json(populatedConversation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get contacts
router.get("/contacts", protectRoute, async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const contacts = await Contact.find({ userId })
            .populate("contactId", "username displayName avatarUrl lastSeen")
            .sort({ createdAt: -1 });

        res.json(contacts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add contact
router.post("/contact/:contactId", protectRoute, async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const contactId = req.params.contactId;
        const { nickname } = req.body;

        const existingContact = await Contact.findOne({ userId, contactId });
        if (existingContact) {
            return res.status(400).json({ error: "Contact already exists" });
        }

        const contact = await Contact.create({
            userId,
            contactId,
            nickname,
        });

        const populatedContact = await Contact.findById(contact._id).populate(
            "contactId",
            "username displayName avatarUrl lastSeen"
        );

        res.json(populatedContact);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update contact
router.put("/contact/:contactId", protectRoute, async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const contactId = req.params.contactId;
        const { nickname, isFavorite } = req.body;

        const contact = await Contact.findOne({ userId, contactId });
        if (!contact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        if (nickname !== undefined) contact.nickname = nickname;
        if (isFavorite !== undefined) contact.isFavorite = isFavorite;

        await contact.save();

        const populatedContact = await Contact.findById(contact._id).populate(
            "contactId",
            "username displayName avatarUrl lastSeen"
        );

        res.json(populatedContact);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete contact
router.delete("/contact/:contactId", protectRoute, async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const contactId = req.params.contactId;

        await Contact.findOneAndDelete({ userId, contactId });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Report message
router.post("/message/:messageId/report", protectRoute, async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        console.log(`User ${userId} reported message ${messageId}`);

        res.status(200).json({ success: true, message: "Message reported" });
    } catch (error: any) {
        console.error("Error reporting message:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
});

// Poll vote – plain object, no Map
router.put("/message/:messageId/vote", protectRoute, async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { optionIndex, isMultiple } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message || !message.poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // Ensure votes is a plain object
        if (!message.poll.votes || typeof message.poll.votes !== 'object') {
            (message.poll as any).votes = {};
        }
        const votes: Record<string, number[]> = (message.poll as any).votes;

        // Get current votes for this user (always an array now)
        let userVotes: number[] = votes[userId] || [];

        if (isMultiple && message.poll.allowMultiple) {
            // Toggle the option
            if (userVotes.includes(optionIndex)) {
                userVotes = userVotes.filter(v => v !== optionIndex);
            } else {
                userVotes.push(optionIndex);
            }
        } else {
            // Single vote – replace
            userVotes = [optionIndex];
        }

        // Update or remove the user's vote entry
        if (userVotes.length === 0) {
            delete votes[userId];
        } else {
            votes[userId] = userVotes;
        }

        // Mark field as modified so Mongoose saves it
        message.markModified('poll.votes');
        await message.save();

        // Notify participants via socket
        const io = (globalThis as any).io;
        if (io) {
            const targets = [message.senderId.toString(), message.receiverId?.toString()].filter(Boolean);
            const sockets = Array.from(io.sockets.sockets.values())
                .filter((s: any) => targets.includes(s.data?.userId));
            sockets.forEach((s: any) => s.emit('poll:updated', { messageId, votes }));
        }

        res.json({ ok: true, votes });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Block status
router.get("/block-status/:userId", protectRoute, async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(otherUserId);

        const isBlocked = currentUser?.blocked?.some((id: any) => id.toString() === otherUserId) || false;
        const isBlockedBy = otherUser?.blocked?.some((id: any) => id.toString() === currentUserId) || false;

        res.json({ isBlocked, isBlockedBy });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Server error" });
    }
});

// Check chat restriction
router.get("/check-restriction", protectRoute, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const restrictedUntil = (user as any).chatRestrictedUntil;
        const restricted: boolean = restrictedUntil && new Date(restrictedUntil) > new Date();

        res.json({ restricted, until: restrictedUntil || null });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Lock conversation
router.put("/conversation/:conversationId/lock", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { password } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).select('+passwordHash');
        if (!user) return res.status(404).json({ error: "User not found" });

        const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect password. Enter your login password." });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        const salt = bcrypt.genSaltSync(10);
        (conversation as any).lockPassword = bcrypt.hashSync(password, salt);   // cast to any

        if (!conversation.lockedBy) conversation.lockedBy = [];
        if (!conversation.lockedBy.some((id: any) => id.toString() === userId.toString())) {
            (conversation.lockedBy as any[]).push(userId as any);
        }
        await conversation.save();

        res.json({ success: true, message: "Chat locked successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Unlock conversation
router.put("/conversation/:conversationId/unlock", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { password } = req.body;
        const userId = req.user._id;

        // Verify this is the user's actual login password
        const user = await User.findById(userId).select('+passwordHash');
        if (!user) return res.status(404).json({ error: "User not found" });

        const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect password. Enter your login password." });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        // Remove user from lockedBy
        conversation.lockedBy = (conversation.lockedBy || []).filter(
            (id: any) => id.toString() !== userId.toString()
        );
        await conversation.save();

        res.json({ success: true, message: "Chat unlocked" });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Unlock all locked chats
router.post("/unlock-all", protectRoute, async (req: Request, res: Response) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).select('+passwordHash');
        if (!user) return res.status(404).json({ error: "User not found" });

        const isLoginPasswordValid = bcrypt.compareSync(password, user.passwordHash);
        if (isLoginPasswordValid) {
            return res.json({ success: true, message: "Access granted to locked chats" });
        }

        const lockedConversations = await Conversation.find({ lockedBy: userId });
        let matchedAny = false;

        for (const conv of lockedConversations) {
            const storedHash = (conv as any).lockPassword;
            if (storedHash && bcrypt.compareSync(password, storedHash)) {
                matchedAny = true;
                break;
            }
        }

        if (matchedAny) {
            return res.json({ success: true, message: "Access granted to locked chats" });
        }

        return res.status(400).json({ error: "Incorrect password." });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Favorite conversation
router.put("/conversation/:conversationId/favorite", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        if (!conversation.favoritedBy) conversation.favoritedBy = [];
        const isFav = conversation.favoritedBy.some((id: any) => id.toString() === userId.toString());

        if (isFav) {
            conversation.favoritedBy = conversation.favoritedBy.filter((id: any) => id.toString() !== userId.toString());
        } else {
            (conversation.favoritedBy as any[]).push(userId as any);
        }
        await conversation.save();

        res.json({ favorited: !isFav });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Report group
router.post("/group/:conversationId/report", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Group not found" });

        (conversation as any).reportCount = ((conversation as any).reportCount || 0) + 1;
        (conversation as any).reportedBy = (conversation as any).reportedBy || [];
        if (!(conversation as any).reportedBy.some((id: any) => id.toString() === userId.toString())) {
            (conversation as any).reportedBy.push(userId);
        }
        await conversation.save();

        if ((conversation as any).reportCount >= 20) {
            await Conversation.findByIdAndDelete(conversationId);
            return res.json({ success: true, message: "Group reported and removed" });
        }

        res.json({ success: true, message: "Group reported" });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Update group settings
router.put("/group/:conversationId/settings", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { adminOnlyMessages, groupRules } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isGroup) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (conversation.admin?.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only admin can update settings" });
        }

        if (adminOnlyMessages !== undefined) (conversation as any).adminOnlyMessages = adminOnlyMessages;
        if (groupRules !== undefined) (conversation as any).groupRules = groupRules;

        await conversation.save();
        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Initiate chat from contact link
router.get("/contact/:userId", protectRoute, async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] },
            isGroup: false,
        }).populate("participants", "username displayName avatarUrl lastSeen");

        if (!conversation) {
            const inviteToken = randomUUID();

            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                isGroup: false,
                inviteToken: inviteToken,
            });
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "username displayName avatarUrl lastSeen");
        }

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Group info
router.get("/group/:conversationId/info", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation.findById(conversationId)
            .populate("participants", "username displayName avatarUrl bio lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        if (!conversation || !conversation.isGroup) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Mark view‑once message as viewed (and clear media)
router.put("/message/:messageId/view-once", protectRoute, async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message || !message.viewOnce) {
            return res.status(404).json({ error: "Not a view‑once message" });
        }

        if (message.viewedBy?.some((id: any) => id.toString() === userId)) {
            return res.status(400).json({ error: "Already viewed" });
        }

        message.viewedBy.push(userId);
        // Clear media so it can't be viewed again
        message.media = [];
        if (message.viewOnce) {
            message.text = '';
        }
        await message.save();

        // Update Redis cache so the change persists across navigations
        if (message.conversationId) {
            await updateCachedMessage(message.conversationId.toString(), messageId, message)
                .catch(err => console.error('Redis update (view-once) error:', err));
        }

        // Notify sender
        if ((globalThis as any).io) {
            const senderSocket = Array.from((globalThis as any).io.sockets.sockets.values())
                .find((s: any) => s.data?.userId === message.senderId.toString()) as any;
            if (senderSocket) {
                senderSocket.emit('message:viewed', { messageId: message._id, viewedBy: userId });
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle disappearing messages timer
router.put("/conversation/:conversationId/disappearing", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { timer } = req.body; // timer in seconds, or null/0 to disable

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { disappearingTimer: timer || null },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Generate group invite link
router.post("/group/:conversationId/invite", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isGroup) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Only admin or existing participants can generate invite
        if (!conversation.participants.some((p: any) => p.toString() === userId.toString())) {
            return res.status(403).json({ error: "Not a participant" });
        }

        // Generate token if not exists
        if (!conversation.inviteToken) {
            conversation.inviteToken = randomUUID();
            await conversation.save();
        }

        res.json({ inviteToken: conversation.inviteToken, inviteLink: `${process.env.CLIENT_URL}/chat?join=${conversation.inviteToken}` });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Join group via invite token
router.post("/join/:token", protectRoute, async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({ inviteToken: token });
        if (!conversation) {
            return res.status(404).json({ error: "Invalid invite link" });
        }

        // Check if already a member
        if (conversation.participants.some((p: any) => p.toString() === userId.toString())) {
            return res.status(400).json({ error: "Already a member" });
        }

        // Add user to group
        conversation.participants.push(userId);
        await conversation.save();

        const populated = await Conversation.findById(conversation._id)
            .populate("participants", "username displayName avatarUrl lastSeen")
            .populate("admin", "username displayName avatarUrl lastSeen");

        // Notify other members via socket
        if ((globalThis as any).io) {
            conversation.participants.forEach((pid: any) => {
                const memberSocket = Array.from((globalThis as any).io.sockets.sockets.values())
                    .find((s: any) => s.data?.userId === pid.toString()) as any;
                if (memberSocket && pid.toString() !== userId) {
                    memberSocket.emit('group:member_joined', { conversationId: conversation._id, userId });
                }
            });
        }

        res.json(populated);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Update group avatar
router.put("/group/:conversationId/avatar", protectRoute, async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { avatarUrl } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isGroup) {
            return res.status(404).json({ error: "Group not found" });
        }
        if (conversation.admin?.toString() !== userId) {
            return res.status(403).json({ error: "Only admin can change avatar" });
        }

        conversation.groupAvatar = avatarUrl;
        await conversation.save();

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Get link preview metadata
router.post("/link-preview", protectRoute, async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    // Only try to fetch http/https URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.json({ url, title: url, domain: url, image: '', description: '' });
    }

    try {
        const cacheKey = `linkpreview:${url}`;
        const cached = await redis.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));

        // Fetch with a realistic user agent and follow redirects
        const response = await axios.get(url, {
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const preview = {
            url,
            title: $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                url,
            description: $('meta[property="og:description"]').attr('content') ||
                $('meta[name="twitter:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                '',
            image: $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                '',
            domain: new URL(url).hostname.replace('www.', ''),
        };

        await redis.setex(cacheKey, 86400, JSON.stringify(preview));
        res.json(preview);
    } catch (error: any) {
        console.warn('Link preview fetch failed, returning basic info:', error.message);
        res.json({
            url,
            title: url,
            description: '',
            image: '',
            domain: (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } })(),
        });
    }
});

router.get("/giphy/trending", protectRoute, async (req: Request, res: Response) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const apiKey = process.env.GIPHY_API_KEY;

        if (!apiKey) {
            // Fallback static GIFs with pagination
            const staticGifs = [
                { id: '1', url: '...', preview: '...' },
                // ... more
            ];
            const page = Number(offset) || 0;
            const pageSize = Number(limit) || 20;
            const paginated = staticGifs.slice(page, page + pageSize);
            return res.json({ gifs: paginated, total: staticGifs.length });
        }

        const response = await axios.get('https://api.giphy.com/v1/gifs/trending', {
            params: {
                api_key: apiKey,
                limit: Number(limit) || 20,
                offset: Number(offset) || 0,
                rating: 'pg-13'
            }
        });

        const gifs = response.data.data.map((gif: any) => ({
            id: gif.id,
            url: gif.images.fixed_height.url,
            preview: gif.images.fixed_height_small.url,
        }));

        res.json({
            gifs,
            total: response.data.pagination.total_count
        });
    } catch (error: any) {
        console.error('GIPHY error:', error.message);
        res.status(500).json({ error: 'GIFs unavailable' });
    }
});

router.get("/giphy/search", protectRoute, async (req: Request, res: Response) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;
        const apiKey = process.env.GIPHY_API_KEY;

        if (!apiKey) {
            // Fallback search - just return empty
            return res.json({ gifs: [], total: 0 });
        }

        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: {
                api_key: apiKey,
                q,
                limit: Number(limit) || 20,
                offset: Number(offset) || 0,
                rating: 'pg-13'
            }
        });

        const gifs = response.data.data.map((gif: any) => ({
            id: gif.id,
            url: gif.images.fixed_height.url,
            preview: gif.images.fixed_height_small.url,
        }));

        res.json({
            gifs,
            total: response.data.pagination.total_count
        });
    } catch (error: any) {
        console.error('GIPHY error:', error.message);
        res.status(500).json({ error: 'GIFs unavailable' });
    }
});

// Get available sticker packs
router.get("/stickers", protectRoute, async (req: Request, res: Response) => {
    try {
        const { limit = 20, skip = 0 } = req.query;
        const pageSize = Number(limit) || 20;
        const skipVal = Number(skip) || 0;

        // Default packs (static – return all, but could also paginate if needed)
        const defaultPacks = [
            {
                id: 'snitch-default',
                name: 'Snitch Default',
                thumbnail: `${process.env.S3_BASE}/stickers/default/thumb.png`,
                stickers: Array.from({ length: 20 }, (_, i) => ({
                    id: `default-${i + 1}`,
                    url: `${process.env.S3_BASE}/stickers/default/${i + 1}.png`,
                })),
            },
            {
                id: 'snitch-emoji',
                name: 'Emoji Mix',
                thumbnail: `${process.env.S3_BASE}/stickers/emoji/thumb.png`,
                stickers: Array.from({ length: 15 }, (_, i) => ({
                    id: `emoji-${i + 1}`,
                    url: `${process.env.S3_BASE}/stickers/emoji/${i + 1}.png`,
                })),
            },
        ];

        // Fetch custom public stickers with pagination
        const [customStickers, totalCustom] = await Promise.all([
            Sticker.find({ isPublic: true })
                .sort({ createdAt: -1 })
                .skip(skipVal)
                .limit(pageSize),
            Sticker.countDocuments({ isPublic: true })
        ]);

        const customPack = {
            id: 'custom',
            name: 'Community Stickers',
            thumbnail: customStickers[0]?.url || '/sticker-placeholder.png',
            stickers: customStickers.map(s => ({
                id: s._id.toString(),
                url: s.url,
            })),
        };

        // Send default packs fully, plus custom pack with pagination metadata
        res.json({
            packs: defaultPacks,
            customPack,
            customPagination: {
                total: totalCustom,
                hasMore: skipVal + pageSize < totalCustom,
                skip: skipVal,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update link preview for a message (and sync Redis)
router.put("/message/:messageId/linkPreview-update", protectRoute, async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;

        // Find the existing message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Update the link preview field directly
        message.linkPreview = req.body;
        await message.save();

        // Fetch the fully populated message for Redis caching
        const populated = await Message.findById(messageId)
            .populate('senderId', 'username displayName avatarUrl')
            .populate('replyTo')
            .populate('mentions', 'username displayName avatarUrl');

        // Update Redis cache with the populated message
        if (message.conversationId) {
            await updateCachedMessage(
                message.conversationId.toString(),
                messageId,
                populated
            ).catch(err => console.error('Redis update (linkPreview) error:', err));
        }

        res.json({ updated: true, message: populated });
    } catch (error: any) {
        console.error('linkPreview-update error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/conversation/:conversationId/export", protectRoute, async (req: Request, res: Response) => {
    try {
        const conversationId = req.params.conversationId;

        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate("senderId", "username displayName")
            .sort({ createdAt: 1 });

        let text = `Snitch Chat Export\nConversation: ${conversationId}\n\n`;
        messages.forEach(msg => {
            // @ts-ignore
            const sender = msg?.senderId?.displayName || msg?.senderId?.username || 'Unknown';
            text += `[${msg.createdAt.toISOString()}] ${sender}: ${msg.text || '[media]'}\n`;
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=chat_${conversationId}.txt`);
        res.send(text);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/message/:messageId/bookmark", protectRoute, async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const index = message.bookmarkedBy.indexOf(userId);
    if (index > -1) message.bookmarkedBy.splice(index, 1);
    else message.bookmarkedBy.push(userId);

    await message.save();

    // Fetch the fully populated message for Redis caching
    const populated = await Message.findById(messageId)
        .populate('senderId', 'username displayName avatarUrl')
        .populate('replyTo')
        .populate('mentions', 'username displayName avatarUrl');

    // Update Redis cache with the populated message
    if (message.conversationId) {
        await updateCachedMessage(
            message.conversationId.toString(),
            messageId,
            populated
        ).catch(err => console.error('Redis update (bookmark message) error:', err));
    }
    res.json({ bookmarked: index === -1 });
});

router.post("/stickers", protectRoute, async (req: Request, res: Response) => {
    try {
        const { url, pack } = req.body;
        const sticker = await Sticker.create({
            userId: req.user._id,
            url,
            pack: pack || 'custom',
            isPublic: true,
        });
        res.json(sticker);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all custom theme colors
router.get("/theme-colors", protectRoute, async (req: Request, res: Response) => {
    try {
        const colors = await ThemeColor.find().sort({ createdAt: -1 });
        res.json(colors);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add a custom theme color
router.post("/theme-colors", protectRoute, async (req: Request, res: Response) => {
    try {
        const { hex } = req.body;
        if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            return res.status(400).json({ error: "Invalid hex color" });
        }

        // Check if already exists
        const existing = await ThemeColor.findOne({ hex: hex.toUpperCase() });
        if (existing) {
            return res.json(existing); // already saved
        }

        // Fetch color name from The Color API (free, no key needed)
        let name = '';
        try {
            const colorRes = await axios.get(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
            name = colorRes.data.name.value || hex;
        } catch {
            name = hex; // fallback
        }

        const newColor = await ThemeColor.create({
            hex: hex.toUpperCase(),
            name,
            createdBy: req.user._id,
        });

        res.json(newColor);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's wallpapers
router.get("/wallpapers", protectRoute, async (req: Request, res: Response) => {
    try {
        const wallpapers = await Wallpaper.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(wallpapers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Save a wallpaper
router.post("/wallpapers", protectRoute, async (req: Request, res: Response) => {
    try {
        const { url, thumb, source } = req.body;
        const wallpaper = await Wallpaper.create({
            userId: req.user._id,
            url,
            thumb,
            source: source || "upload",
        });
        res.json(wallpaper);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a wallpaper
router.delete("/wallpapers/:id", protectRoute, async (req: Request, res: Response) => {
    try {
        await Wallpaper.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/chat/unread-counts
router.get('/unread-counts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        
        // Get all conversations for this user
        const conversations = await Conversation.find({
            participants: userId,
        }).select('_id');
        
        const conversationIds = conversations.map(c => c._id);
        
        // Count unread messages for each conversation
        const unreadCounts = {};
        
        for (const convId of conversationIds) {
            const count = await Message.countDocuments({
                conversationId: convId,
                senderId: { $ne: userId },
                readBy: { $ne: userId },
            });
            unreadCounts[convId.toString()] = count;
        }
        
        res.status(200).json(unreadCounts);
    } catch (error: any) {
        console.error('Error fetching unread counts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/chat/mark-read
router.post('/mark-read', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { conversationId } = req.body;
        
        if (!conversationId) {
            return res.status(400).json({ message: 'Conversation ID required' });
        }
        
        // Mark all messages in this conversation as read for this user
        await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                readBy: { $ne: userId },
            },
            {
                $addToSet: { readBy: userId },
            }
        );
        
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/wallpapers/search", protectRoute, async (req: Request, res: Response) => {
    try {
        const { query = "nature", page = 1, per_page = 20 } = req.query;
        const accessKey = process.env.UNSPLASH_ACCESS_KEY;

        if (!accessKey) {
            return res.status(500).json({ error: "Unsplash API key not configured" });
        }

        const response = await axios.get("https://api.unsplash.com/search/photos", {
            params: {
                query,
                page: Number(page),
                per_page: Number(per_page),
                orientation: "portrait",
            },
            headers: {
                Authorization: `Client-ID ${accessKey}`,
            },
        });

        const images = response.data.results.map((img: any) => ({
            id: img.id,
            url: img.urls.regular,
            thumb: img.urls.thumb,
            download_url: img.links.download_location,
        }));

        res.json({
            images,
            total: response.data.total,
            total_pages: response.data.total_pages,
        });
    } catch (error: any) {
        console.error("Unsplash error:", error.message);
        res.status(500).json({ error: "Failed to fetch wallpapers" });
    }
});

export default router;
