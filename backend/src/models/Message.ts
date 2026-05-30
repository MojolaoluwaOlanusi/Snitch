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
            required: true,
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
        // readAt: map of userId -> Date
        readAt: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

messageSchema.index(
    { text: "text" },
    {
        weights: { text: 5 },
        name: "MessageTextIndex",
    }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;