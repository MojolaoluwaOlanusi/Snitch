// Only use this during development by changing the dev script in .env to run allowadmin.ts

import mongoose from 'mongoose';
import { User } from '../models/User.js';

(async () => {
    await mongoose.connect('mongodb+srv://Victor:Darasimi_2010@database.pu7f6ws.mongodb.net/?appName=Database');
    await User.updateOne({ email: "olanusimojola@gmail.com" }, { isAdmin: true });
    console.log("Admin user updated ✅");
    await mongoose.disconnect();
})();
