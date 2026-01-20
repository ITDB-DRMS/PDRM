
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Role from './models/Role.js';
import Permission from './models/Permission.js';
import RolePermission from './models/RolePermission.js';
import Organization from './models/Organization.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const email = process.env.ADMIN_EMAIL || 'admin@idrmis.com';
        const password = process.env.ADMIN_PASSWORD || 'Admin@123';
        const fullname = process.env.ADMIN_NAME || 'Super Administrator';

        console.log('\n🔐 Creating Super Admin...');
        console.log(`📧 Email: ${email}`);

        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 1: Ensure Head Office organization exists
        let headOffice = await Organization.findOne({ type: 'head_office' });

        if (!headOffice) {
            console.log('🏢 Creating Head Office organization...');
            headOffice = await Organization.create({
                name: 'Head Office',
                type: 'head_office',
                status: 'active',
                description: 'Main headquarters'
            });
            console.log('✅ Head Office created');
        } else {
            console.log('✅ Head Office already exists');
        }

        // Step 2: Ensure Super Admin role exists
        let superAdminRole = await Role.findOne({ name: 'Super Admin' });

        if (!superAdminRole) {
            console.log('👑 Creating Super Admin role...');
            superAdminRole = await Role.create({
                name: 'Super Admin',
                type: 'head_office',
                description: 'Full system access with all privileges'
            });
            console.log('✅ Super Admin role created');
        } else {
            console.log('✅ Super Admin role already exists');
        }

        // Step 3: Get all permissions and assign to Super Admin role
        const allPermissions = await Permission.find({});

        if (allPermissions.length > 0) {
            console.log(`🔑 Assigning ${allPermissions.length} permissions to Super Admin role...`);

            for (const permission of allPermissions) {
                const existingRolePermission = await RolePermission.findOne({
                    roleId: superAdminRole._id,
                    permissionId: permission._id
                });

                if (!existingRolePermission) {
                    await RolePermission.create({
                        roleId: superAdminRole._id,
                        permissionId: permission._id
                    });
                }
            }
            console.log('✅ All permissions assigned to Super Admin role');
        } else {
            console.log('⚠️  No permissions found in database. You may need to seed permissions first.');
        }

        // Step 4: Create or update Super Admin user
        let user = await User.findOne({ email });

        if (user) {
            console.log('👤 Super Admin user exists. Updating...');

            user.fullname = fullname;
            user.passwordHash = hashedPassword;
            user.status = 'active';
            user.accessLevel = 'super_admin';
            user.organizationType = 'head_office';
            user.organization = headOffice._id;
            user.roles = [superAdminRole._id];

            // Clear any delegation or reporting relationships
            user.delegatedBy = null;
            user.delegatedAuthority = {
                canManageTeams: false,
                canManageDepartments: false,
                canApproveReports: false
            };
            user.reportsTo = null;
            user.team = null;
            user.managedDepartments = [];
            user.managedTeams = [];

            await user.save();
            console.log('✅ Super Admin user updated');
        } else {
            console.log('👤 Creating new Super Admin user...');

            user = await User.create({
                fullname: fullname,
                email: email,
                phone: process.env.ADMIN_PHONE || '+251911000000',
                passwordHash: hashedPassword,
                status: 'active',

                // RBAC
                roles: [superAdminRole._id],

                // Hierarchical RBAC
                accessLevel: 'super_admin',
                organizationType: 'head_office',
                organization: headOffice._id,
                department: null,
                team: null,

                // No delegation or reporting for super admin
                delegatedBy: null,
                delegatedAuthority: {
                    canManageTeams: false,
                    canManageDepartments: false,
                    canApproveReports: false
                },
                reportsTo: null,
                managedDepartments: [],
                managedTeams: [],

                // Onboarding
                onboarding: {
                    welcomeShown: true,
                    profileCompleted: true,
                    acceptedTerms: true
                }
            });

            console.log('✅ Super Admin user created');
        }

        console.log('\n🎉 Super Admin Setup Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Super Admin Details:');
        console.log(`   Name: ${user.fullname}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Access Level: ${user.accessLevel}`);
        console.log(`   Organization Type: ${user.organizationType}`);
        console.log(`   Organization: ${headOffice.name}`);
        console.log(`   Role: ${superAdminRole.name}`);
        console.log(`   Permissions: ${allPermissions.length} (All)`);
        console.log(`   Status: ${user.status}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ You can now login with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('\n🚀 Super Admin has full access to:');
        console.log('   ✅ All users across all organizations');
        console.log('   ✅ All teams and departments');
        console.log('   ✅ All permissions and roles');
        console.log('   ✅ Delegation management');
        console.log('   ✅ Hierarchy management');
        console.log('   ✅ System configuration');
        console.log('\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

