import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        nickname: {
            type: String,
        },
        isFavorite: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
        },
    },
    { timestamps: true }
);

contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
