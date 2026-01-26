import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

dotenv.config();

const tracePermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // 1. Check Permissions
        const permissionCount = await Permission.countDocuments();
        console.log(`[1] Total Permissions in DB: ${permissionCount}`);
        if (permissionCount === 0) {
            console.log('    ❌ CRITICAL: No permissions found. Run seeder!');
        } else {
            const sample = await Permission.findOne();
            console.log(`    ✓ Permission Sample: ${sample.name} (${sample.resource}_${sample.action})`);
        }

        // 2. Check Roles
        const roles = await Role.find({});
        console.log(`\n[2] Total Roles: ${roles.length}`);
        if (roles.length === 0) {
            console.log('    ❌ CRITICAL: No roles found!');
        }

        // 3. Trace a Role
        for (const role of roles) {
            if (role.name === 'Super Admin') continue; // Skip super admin

            console.log(`\n    Checking Role: "${role.name}" (ID: ${role._id})`);

            // Check RolePermissions
            const rolePerms = await RolePermission.find({ roleId: role._id }).populate('permissionId');
            console.log(`    - Has ${rolePerms.length} assigned permissions`);

            if (rolePerms.length > 0) {
                const validPerms = rolePerms.filter(rp => rp.permissionId);
                console.log(`    - Valid links: ${validPerms.length}/${rolePerms.length}`);
                if (validPerms.length > 0) {
                    console.log(`    - Sample: ${validPerms[0].permissionId.name}`);
                }
            } else {
                console.log('    ⚠️ Role has NO permissions assigned!');
            }
        }

        // 4. Check specific user from previous logs
        const targetEmail = 'sh1229876@gmail.com'; // Adjust if needed
        const user = await User.findOne({ email: { $regex: 'gmail.com' } }).populate('roles');

        if (user) {
            console.log(`\n[3] Checking User: ${user.fullname} (${user.email})`);
            console.log(`    - Access Level: ${user.accessLevel}`);
            console.log(`    - Assigned Roles: ${user.roles.length}`);

            if (user.roles.length > 0) {
                user.roles.forEach(r => console.log(`      * ${r.name}`));

                // Calculate effective permissions
                const roleIds = user.roles.map(r => r._id);
                const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds } }).populate('permissionId');
                const effective = rolePermissions
                    .filter(rp => rp.permissionId)
                    .map(rp => rp.permissionId.name);

                console.log(`    - Effective Permissions: ${effective.length}`);
                if (effective.length > 0) {
                    console.log(`    - Examples: ${effective.slice(0, 3).join(', ')}`);
                } else {
                    console.log('    ❌ User has roles, but those roles have no permissions!');
                }
            } else {
                console.log('    ⚠️ User has NO roles assigned.');
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

tracePermissions();
