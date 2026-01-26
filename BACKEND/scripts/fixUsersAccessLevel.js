import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixUsersAccessLevel = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Find users without accessLevel
        const usersWithoutAccessLevel = await User.find({
            $or: [
                { accessLevel: { $exists: false } },
                { accessLevel: null },
                { accessLevel: '' }
            ]
        });

        console.log(`Found ${usersWithoutAccessLevel.length} users without accessLevel\n`);

        if (usersWithoutAccessLevel.length > 0) {
            // Update them with default 'public' accessLevel
            for (const user of usersWithoutAccessLevel) {
                user.accessLevel = 'public';
                await user.save();
                console.log(`✓ Updated ${user.fullname} (${user.email}) - Set accessLevel to 'public'`);
            }
            console.log(`\n✓ Successfully updated ${usersWithoutAccessLevel.length} users`);
        } else {
            console.log('✓ All users already have accessLevel set');
        }

        // Display all users with their access levels
        const allUsers = await User.find({}).select('fullname email accessLevel organizationType');
        console.log('\n=== All Users ===');
        allUsers.forEach(user => {
            console.log(`${user.fullname} (${user.email})`);
            console.log(`  Access Level: ${user.accessLevel}`);
            console.log(`  Org Type: ${user.organizationType}`);
            console.log('');
        });

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixUsersAccessLevel();
