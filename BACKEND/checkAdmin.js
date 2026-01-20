import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const email = process.env.ADMIN_EMAIL || 'admin@idrmis.com';

        console.log('🔍 Searching for admin user...');
        console.log(`📧 Email: ${email}\n`);

        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ email });

        if (user) {
            console.log('✅ Admin user found!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📋 User Details:');
            console.log(`   Name: ${user.fullname}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phone || 'Not set'}`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Access Level: ${user.accessLevel || 'Not set'}`);
            console.log(`   Organization Type: ${user.organizationType || 'Not set'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            console.log('🔐 Login Credentials:');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Check .env file'}`);
            console.log('\n📍 Login URL: http://localhost:5173\n');

            if (!user.accessLevel) {
                console.log('⚠️  WARNING: User exists but has no accessLevel!');
                console.log('💡 Run migration to update: node migrations/updateUsersWithHierarchy.js\n');
            }
        } else {
            console.log('❌ Admin user NOT found!\n');
            console.log('💡 Run this command to create admin:');
            console.log('   node seedAdmin.js\n');

            // Show all users
            const allUsers = await User.find({}).limit(10).toArray();
            if (allUsers.length > 0) {
                console.log('📋 Existing users in database:');
                allUsers.forEach((u, i) => {
                    console.log(`   ${i + 1}. ${u.email} - ${u.fullname} (${u.accessLevel || 'no level'})`);
                });
                console.log('');
            } else {
                console.log('⚠️  No users found in database!');
                console.log('💡 Create admin user: node seedAdmin.js\n');
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkAdmin();
