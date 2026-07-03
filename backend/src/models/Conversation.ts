import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        groupAvatar: {
            type: String,
        },
        groupDescription: {
            type: String,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        pinnedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        archivedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        mutedBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                until: {
                    type: Date,
                },
            },
        ],
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        lockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        adminOnlyMessages: { type: Boolean, default: false },
        groupRules: { type: String },
        reportCount: { type: Number, default: 0 },
        reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lockPassword: String,
        disappearingTimer: { type: Number, default: null }, // in seconds, null = off
        avatarColor: { type: String, default: null },
        inviteToken: { type: String, unique: true, sparse: true, default: null },
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
