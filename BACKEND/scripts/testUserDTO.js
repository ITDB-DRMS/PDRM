import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { formatUserResponse } from '../dto/userDTO.js';

dotenv.config();

const testUserDTO = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({})
            .populate('roles')
            .populate('organization')
            .populate('sector')
            .populate('department')
            .populate('team');

        console.log(`Found ${users.length} users\n`);
        console.log('=== Testing formatUserResponse DTO ===\n');

        users.forEach(user => {
            const formatted = formatUserResponse(user);
            console.log('User:', formatted.fullname);
            console.log('Email:', formatted.email);
            console.log('Access Level:', formatted.accessLevel);
            console.log('Organization Type:', formatted.organizationType);
            console.log('Raw user.accessLevel:', user.accessLevel);
            console.log('---');
        });

        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testUserDTO();
