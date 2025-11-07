// src/config/env.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES module support
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Optional: log environment status
if (process.env.NODE_ENV !== "production") {
    console.log("✅ Environment variables loaded from .env");
}

export default process.env;
