import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
        },
        text: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        // array of media objects (images, videos, audio, documents)
        media: {
            type: [
                {
                    url: String,
                    mime: String,
                    size: Number,
                    caption: String,
                    filename: String,
                    duration: Number, // for audio/video
                    thumbnail: String,
                },
            ],
            default: [],
        },
        // reactions: { userId: reaction }
        reactions: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        editedAt: {
            type: Date,
        },
        deletedAt: {
            type: Date,
        },
        deletedForEveryone: {
            type: Boolean,
            default: false,
        },
        // readAt: map of userId -> Date
        readAt: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        read: {
            type: Boolean,
            default: false,
        },
        // reply to message
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        // forward info
        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        forwardedCount: {
            type: Number,
            default: 0,
        },
        // voice message
        isVoiceMessage: {
            type: Boolean,
            default: false,
        },
        voiceDuration: {
            type: Number,
        },
        // location
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
        },
        // contact
        contact: {
            name: String,
            phoneNumber: String,
        },
        // view once (like WhatsApp)
        viewOnce: {
            type: Boolean,
            default: false,
        },
        viewedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // starred
        starredBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // message status
        status: {
            type: String,
            enum: ["sent", "delivered", "read", "failed"],
            default: "sent",
        },
        // mentions
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

messageSchema.index({ text: "text" });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;