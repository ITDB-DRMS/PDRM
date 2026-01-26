import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import { getUserPermissions } from '../services/userService.js';

dotenv.config();

const debugUserPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find a user who has roles and is NOT super_admin (if possible)
        const user = await User.findOne({
            roles: { $exists: true, $not: { $size: 0 } },
            accessLevel: { $ne: 'super_admin' }
        }).populate('roles');

        if (!user) {
            console.log("No standard user with roles found. Testing with FIRST user found.");
            var fallbackUser = await User.findOne({ roles: { $exists: true, $not: { $size: 0 } } }).populate('roles');
            if (!fallbackUser) {
                console.log("No users with roles found at all!");
                process.exit(0);
            }
            await analyzeUser(fallbackUser);
        } else {
            await analyzeUser(user);
        }

        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

async function analyzeUser(user) {
    console.log('=== User Analysis ===');
    console.log(`User: ${user.fullname} (${user.email})`);
    console.log(`Access Level: ${user.accessLevel}`);
    console.log(`Roles: ${user.roles.map(r => r.name).join(', ')}`);

    console.log('\n=== Role Permissions Breakdown ===');
    if (user.roles.length === 0) {
        console.log("User has no roles!");
    }

    for (const role of user.roles) {
        console.log(`\nChecking Role: ${role.name} (${role._id})`);

        // Find raw RolePermission entries
        const rolePerms = await RolePermission.find({ roleId: role._id });
        console.log(`  Found ${rolePerms.length} RolePermission entries`);

        if (rolePerms.length > 0) {
            // Check first entry detail
            const populated = await RolePermission.find({ roleId: role._id }).populate('permissionId');

            populated.forEach(rp => {
                if (rp.permissionId) {
                    console.log(`    - Permission: ${rp.permissionId.name} (Resource: ${rp.permissionId.resource}, Action: ${rp.permissionId.action})`);
                } else {
                    console.log(`    - Permission ID ${rp.permissionId} NOT FOUND in Permissions collection!`);
                }
            });
        }
    }

    console.log('\n=== Service Function Test ===');
    try {
        const calculatedPermissions = await getUserPermissions(user);
        console.log('Permissions returned by userService.getUserPermissions:');
        console.log(JSON.stringify(calculatedPermissions, null, 2));
    } catch (e) {
        console.log("Error calling getUserPermissions:", e.message);
    }
}

debugUserPermissions();
