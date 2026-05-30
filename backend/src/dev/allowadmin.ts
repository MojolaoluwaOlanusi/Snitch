// Only use this during development by changing the dev script in .env to run allowadmin.ts

import mongoose from 'mongoose';
import { User } from '../models/User.ts';

(async () => {
    await mongoose.connect('mongodb://localhost:27017/snitch');
    await User.updateOne({ email: "olanusimojola@gmail.com" }, { isAdmin: true });
    console.log("Admin user updated ✅");
    await mongoose.disconnect();
})();
