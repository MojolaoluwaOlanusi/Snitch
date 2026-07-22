import mongoose from 'mongoose';
import { User } from '../../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI!);

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let count = 0;
    for (const user of users) {
        user.usernameLower = user.username.toLowerCase();
        await user.save();
        count++;
        if (count % 100 === 0) console.log(`Migrated ${count} users`);
    }

    console.log(`✅ Migration complete! Updated ${count} users.`);
    await mongoose.disconnect();
}

migrate().catch(console.error);