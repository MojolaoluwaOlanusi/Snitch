import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["follow", "like", "react", "repost", "mention", "bookmark", "message"],
        },
        read: {
            type: Boolean,
            default: false,
        },
        fromAvatarUrl: {
            type: String,
        },
        // Additional fields for mention notifications
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
        },
        text: {
            type: String,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;