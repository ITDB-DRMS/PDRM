import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

dotenv.config();

const debugPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // 1. Check all users and their role counts
        const users = await User.find({}).populate('roles');
        console.log('--- User Role Summary ---');
        users.forEach(u => {
            console.log(`User: ${u.fullname} | Roles: ${u.roles.length} (${u.roles.map(r => r.name).join(', ')})`);
        });
        console.log('-------------------------\n');

        // 2. Pick the first user with roles
        const user = users.find(u => u.roles.length > 0);

        if (user) {
            console.log(`Analyzing User: ${user.fullname}`);
            for (const role of user.roles) {
                console.log(`\n  Role: ${role.name}`);
                const rolePerms = await RolePermission.find({ roleId: role._id }).populate('permissionId');
                console.log(`  Permissions Count: ${rolePerms.length}`);
                rolePerms.forEach(rp => {
                    if (rp.permissionId) {
                        console.log(`    - ${rp.permissionId.name} (${rp.permissionId.resource}_${rp.permissionId.action})`);
                    } else {
                        console.log(`    - BROKEN LINK (Permission ID: ${rp.permissionId})`);
                    }
                });
            }
        } else {
            console.log('❌ No users with roles found!');
        }

        // 3. List all available roles
        const roles = await Role.find({});
        console.log('\n--- Available Roles ---');
        roles.forEach(r => console.log(`- ${r.name} (ID: ${r._id})`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugPermissions();
