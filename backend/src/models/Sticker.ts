import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        url: { type: String, required: true },       // MinIO public URL
        pack: { type: String, default: "custom" },    // "custom" or a specific pack name
        isPublic: { type: Boolean, default: true },   // visible to everyone
    },
    { timestamps: true }
);

export const Sticker = mongoose.model("Sticker", stickerSchema);