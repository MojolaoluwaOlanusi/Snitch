import mongoose from "mongoose";

const wallpaperSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        url: { type: String, required: true },
        thumb: { type: String },
        source: { type: String, default: "upload" }, // "upload" or "unsplash"
    },
    { timestamps: true }
);

export const Wallpaper = mongoose.model("Wallpaper", wallpaperSchema);