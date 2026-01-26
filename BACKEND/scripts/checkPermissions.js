import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Permission from '../models/Permission.js';

dotenv.config();

const checkPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        const count = await Permission.countDocuments();
        console.log(`Total Permissions in DB: ${count}`);

        if (count === 0) {
            console.log('⚠️ WARNING: No permissions found! Run the seeder.');
        } else {
            const perms = await Permission.find({});
            console.log('Sample Permissions:');
            perms.slice(0, 5).forEach(p => console.log(`- ${p.name} (${p.resource}_${p.action})`));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkPermissions();
