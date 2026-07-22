import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupUsernames() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Connected to MongoDB');

        // 1. Find users with leading/trailing whitespace in username
        const usersWithWhitespace = await User.find({
            $or: [
                { username: { $regex: /^\s/ } }, // Starts with space
                { username: { $regex: /\s$/ } }  // Ends with space
            ]
        });

        console.log(`🔍 Found ${usersWithWhitespace.length} users with whitespace in username.`);

        let updatedCount = 0;
        let conflictCount = 0;
        const conflicts: string[] = [];

        for (const user of usersWithWhitespace) {
            const trimmedUsername = user.username.trim();

            // Skip if already trimmed (shouldn't happen with the regex, but just in case)
            if (trimmedUsername === user.username) continue;

            // Check for duplicate username (case-insensitive, excluding self)
            const existingUser = await User.findOne({
                usernameLower: trimmedUsername.toLowerCase(),
                _id: { $ne: user._id }
            });

            if (existingUser) {
                const msg = `⚠️ Conflict: Username "${trimmedUsername}" already exists for user ${existingUser._id} (${existingUser.username}). Skipping ${user._id} (current: "${user.username}").`;
                console.warn(msg);
                conflicts.push(msg);
                conflictCount++;
                continue;
            }

            // Update the user
            user.username = trimmedUsername;
            user.usernameLower = trimmedUsername.toLowerCase();
            await user.save();
            updatedCount++;
            console.log(`✅ Updated user ${user._id}: "${user.username}" -> "${trimmedUsername}"`);
        }

        // 2. Backfill any users missing usernameLower (safety net)
        const usersMissingLower = await User.find({
            $or: [
                { usernameLower: { $exists: false } },
                { usernameLower: null }
            ]
        });

        if (usersMissingLower.length > 0) {
            console.log(`🔍 Found ${usersMissingLower.length} users missing usernameLower. Fixing...`);
            for (const user of usersMissingLower) {
                user.usernameLower = user.username.toLowerCase();
                await user.save();
                console.log(`✅ Set usernameLower for ${user._id} (${user.username})`);
            }
        }

        // 3. Report summary
        console.log('\n📊 ===== MIGRATION COMPLETE =====');
        console.log(`✅ Updated ${updatedCount} users (removed whitespace).`);
        console.log(`⚠️ ${conflictCount} conflicts found (skipped).`);
        if (conflicts.length > 0) {
            console.log('\n🚨 Conflicts (must be resolved manually):');
            conflicts.forEach(c => console.log(`   ${c}`));
            console.log('\n💡 To resolve conflicts:');
            console.log('   - Merge the two users manually (keep the correct username).');
            console.log('   - Or delete/rename one of the conflicting users.');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

cleanupUsernames();