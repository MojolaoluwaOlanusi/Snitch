import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDisplayNames() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Connected to MongoDB');

        // Only find documents where displayName exists and ends with a space
        const usersWithWhitespace = await User.find({
            displayName: { $exists: true, $regex: /\s$/ }
        });

        console.log(`🔍 Found ${usersWithWhitespace.length} users with trailing whitespace in displayName.`);

        let updatedCount = 0;

        for (const user of usersWithWhitespace) {
            // Safety check for TypeScript (and runtime)
            if (!user.displayName) continue;

            const trimmedDisplayName = user.displayName.trim();
            if (trimmedDisplayName === user.displayName) continue;

            user.displayName = trimmedDisplayName;
            await user.save();
            updatedCount++;
            console.log(`✅ Updated user ${user._id}: "${user.displayName}" -> "${trimmedDisplayName}" (username: ${user.username})`);
        }

        console.log('\n📊 ===== MIGRATION COMPLETE =====');
        console.log(`✅ Updated ${updatedCount} users (removed trailing whitespace from displayName).`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

cleanupDisplayNames();