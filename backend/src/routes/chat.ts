import express from "express";
import Message from "../models/Message.ts";
import Conversation from "../models/Conversation.ts";
import Contact from "../models/Contact.ts";
import { protectRoute } from "../middleware/protectRoute.ts";

const router = express.Router();

// Get all conversations for a user
router.get("/conversations", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "username displayName avatarUrl")
            .populate("lastMessage")
            .populate("admin", "username displayName avatarUrl")
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

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] },
            isGroup: false,
        })
            .populate("participants", "username displayName avatarUrl")
            .populate("lastMessage");

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                isGroup: false,
            });
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "username displayName avatarUrl")
                .populate("lastMessage");
        }

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

        const query: any = { conversationId };
        if (before) {
            query._id = { $lt: before };
        }

        const messages = await Message.find(query)
            .populate("senderId", "username displayName avatarUrl")
            .populate("replyTo")
            .populate("mentions", "username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json(messages.reverse());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
            .populate("senderId", "username displayName avatarUrl")
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

        const isStarred = message.starredBy?.includes(userId);
        if (isStarred) {
            message.starredBy = message.starredBy.filter((id: any) => id.toString() !== userId.toString());
        } else {
            message.starredBy.push(userId);
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
            .populate("senderId", "username displayName avatarUrl")
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
        const { duration } = req.body; // in hours, or null for forever
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const existingMute = conversation.mutedBy?.find((m: any) => m.user.toString() === userId.toString());
        if (existingMute) {
            // Unmute
            conversation.mutedBy = conversation.mutedBy.filter((m: any) => m.user.toString() !== userId.toString());
        } else {
            // Mute
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

        // Update unread count
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

// Clear chat (delete all messages for user)
router.delete("/conversation/:conversationId/clear", protectRoute, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Soft delete messages by setting deletedAt for this user
        await Message.updateMany(
            {
                conversationId,
                $or: [{ senderId: userId }, { receiverId: userId }],
            },
            { deletedAt: new Date() }
        );

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
            .populate("participants", "username displayName avatarUrl")
            .populate("admin", "username displayName avatarUrl");

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
            .populate("participants", "username displayName avatarUrl")
            .populate("admin", "username displayName avatarUrl");

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
            .populate("participants", "username displayName avatarUrl")
            .populate("admin", "username displayName avatarUrl");

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
            .populate("participants", "username displayName avatarUrl")
            .populate("admin", "username displayName avatarUrl");

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
            .populate("contactId", "username displayName avatarUrl")
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
            "username displayName avatarUrl"
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
            "username displayName avatarUrl"
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

export default router;
