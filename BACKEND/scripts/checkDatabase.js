import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        const users = await User.find({}).lean();

        console.log(`Total users: ${users.length}\n`);

        users.forEach(user => {
            console.log('='.repeat(50));
            console.log('User:', user.fullname);
            console.log('Email:', user.email);
            console.log('Has accessLevel field?', 'accessLevel' in user);
            console.log('accessLevel value:', user.accessLevel);
            console.log('accessLevel type:', typeof user.accessLevel);
            console.log('Has organizationType field?', 'organizationType' in user);
            console.log('organizationType value:', user.organizationType);
        });

        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDatabase();
