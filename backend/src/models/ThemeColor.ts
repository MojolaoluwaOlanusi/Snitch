import mongoose from "mongoose";

const themeColorSchema = new mongoose.Schema(
    {
        hex: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export const ThemeColor = mongoose.model("ThemeColor", themeColorSchema);