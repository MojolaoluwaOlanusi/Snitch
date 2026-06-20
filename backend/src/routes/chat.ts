import express from "express";
import {User} from "../models/User.ts";
import Message from "../models/Message.ts";
import Conversation from "../models/Conversation.ts";
import Contact from "../models/Contact.ts";
import bcrypt from 'bcryptjs';
import { protectRoute } from "../middleware/protectRoute.ts";
import { redis, getCachedMessages, updateCachedMessage } from '../utils/redisCache.ts';
import axios from 'axios';
// Declare global io type so TypeScript knows it exists
declare global {
    var io: any;
}

const router = express.Router();

// Translate message text
router.post("/translate", protectRoute, async (req, res) => {
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
router.get("/conversations", protectRoute, async (req, res) => {
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
router.post("/conversation/:userId", protectRoute, async (req, res) => {
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
            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                isGroup: false,
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
router.get("/messages/:conversationId", protectRoute, async (req, res) => {
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
router.get("/search/:conversationId", protectRoute, async (req, res) => {
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
router.put("/message/:messageId/star", protectRoute, async (req, res) => {
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
        res.json({ starred: !isStarred });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get starred messages
router.get("/starred/:conversationId", protectRoute, async (req, res) => {
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

// Pin/Unpin conversation
router.put("/conversation/:conversationId/pin", protectRoute, async (req, res) => {
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
router.put("/conversation/:conversationId/archive", protectRoute, async (req, res) => {
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
router.put("/conversation/:conversationId/mute", protectRoute, async (req, res) => {
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
router.put("/conversation/:conversationId/read", protectRoute, async (req, res) => {
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
router.delete("/conversation/:conversationId/clear", protectRoute, async (req, res) => {
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
router.post("/group", protectRoute, async (req, res) => {
    try {
        const { name, participantIds, avatar, description } = req.body;
        const adminId = req.user._id;

        const conversation = await Conversation.create({
            participants: [adminId, ...participantIds],
            isGroup: true,
            groupName: name,
            groupAvatar: avatar,
            groupDescription: description,
            admin: adminId,
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
router.put("/group/:conversationId/add", protectRoute, async (req, res) => {
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
router.put("/group/:conversationId/remove", protectRoute, async (req, res) => {
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
router.put("/group/:conversationId", protectRoute, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { name, avatar, description } = req.body;
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
router.get("/contacts", protectRoute, async (req, res) => {
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
router.post("/contact/:contactId", protectRoute, async (req, res) => {
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
router.put("/contact/:contactId", protectRoute, async (req, res) => {
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
router.delete("/contact/:contactId", protectRoute, async (req, res) => {
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
router.post("/message/:messageId/report", protectRoute, async (req, res) => {
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

// Poll vote
router.put("/message/:messageId/vote", protectRoute, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message || !message.poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        if (!message.poll.votes) {
            (message.poll as any).votes = new Map();
        }

        (message.poll.votes as Map<string, number>).set(userId.toString(), optionIndex);
        message.markModified('poll.votes');
        await message.save();

        const votesObj: Record<string, number> = {};
        (message.poll.votes as Map<string, number>).forEach((value: number, key: string) => {
            votesObj[key] = value;
        });

        if ((globalThis as any).io) {
            const targets = [message.senderId.toString(), message.receiverId?.toString()].filter(Boolean);
            const sockets = Array.from((globalThis as any).io.sockets.sockets.values()).filter((s: any) => targets.includes(s.data?.userId));
            sockets.forEach((s: any) => s.emit('poll:updated', { messageId, votes: votesObj }));
        }

        res.json({ ok: true, votes: votesObj });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Block status
router.get("/block-status/:userId", protectRoute, async (req, res) => {
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
router.get("/check-restriction", protectRoute, async (req, res) => {
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
router.put("/conversation/:conversationId/lock", protectRoute, async (req, res) => {
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
        const hashedPassword = bcrypt.hashSync(password, salt);
        (conversation as any).lockPassword = hashedPassword;   // cast to any

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
router.put("/conversation/:conversationId/unlock", protectRoute, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { password } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        const storedHash = (conversation as any).lockPassword;   // cast to any
        const isPasswordValid = storedHash && bcrypt.compareSync(password, storedHash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect password." });
        }

        conversation.lockedBy = (conversation.lockedBy || []).filter((id: any) => id.toString() !== userId.toString());
        if (conversation.lockedBy.length === 0) {
            (conversation as any).lockPassword = undefined;
        }
        await conversation.save();

        res.json({ success: true, message: "Chat unlocked successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

// Unlock all locked chats
router.post("/unlock-all", protectRoute, async (req, res) => {
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
router.put("/conversation/:conversationId/favorite", protectRoute, async (req, res) => {
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
router.post("/group/:conversationId/report", protectRoute, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { reason } = req.body;
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
router.put("/group/:conversationId/settings", protectRoute, async (req, res) => {
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
router.get("/contact/:userId", protectRoute, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] },
            isGroup: false,
        }).populate("participants", "username displayName avatarUrl lastSeen");

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                isGroup: false,
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
router.get("/group/:conversationId/info", protectRoute, async (req, res) => {
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
router.put("/message/:messageId/view-once", protectRoute, async (req, res) => {
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
        message.text = message.text || 'View‑once media';
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
router.put("/conversation/:conversationId/disappearing", protectRoute, async (req, res) => {
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

// Set wallpaper for a conversation
router.put("/conversation/:conversationId/wallpaper", protectRoute, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { wallpaperUrl } = req.body;

        if (!wallpaperUrl) {
            return res.status(400).json({ error: "wallpaperUrl is required" });
        }

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { wallpaper: wallpaperUrl },
            { new: true }   // return updated document
        );

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json(conversation);
    } catch (error: any) {
        console.error('Wallpaper route error:', error);
        res.status(500).json({ error: error?.message || "Server error" });
    }
});

export default router;