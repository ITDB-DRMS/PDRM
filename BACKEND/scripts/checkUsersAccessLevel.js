import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkUsersAccessLevel = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Get all users and display their access levels
        const users = await User.find({}).select('fullname email accessLevel organizationType');

        console.log('Total users:', users.length);
        console.log('\nUser Access Levels:');
        console.log('===================\n');

        users.forEach(user => {
            console.log(`Name: ${user.fullname}`);
            console.log(`Email: ${user.email}`);
            console.log(`Access Level: ${user.accessLevel || 'UNDEFINED'}`);
            console.log(`Organization Type: ${user.organizationType || 'UNDEFINED'}`);
            console.log('---');
        });

        // Count users without accessLevel
        const usersWithoutAccessLevel = users.filter(u => !u.accessLevel);
        console.log(`\nUsers without accessLevel: ${usersWithoutAccessLevel.length}`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsersAccessLevel();
