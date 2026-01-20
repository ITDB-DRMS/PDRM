import Department from '../models/Department.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Organization from '../models/Organization.js';
import Sector from '../models/Sector.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

/**
 * Get dashboard statistics filtered by user's permissions and hierarchy
 * @param {Object} user - The authenticated user object with populated fields
 * @returns {Object} Dashboard statistics scoped to user's access
 */
export const getDashboardStats = async (user) => {
    // Get user's permissions for dashboard cards
    const permissions = await getUserDashboardPermissions(user);

    // Build filter based on user's organizational hierarchy
    const filter = buildHierarchyFilter(user);

    // Initialize stats object with permissions
    const stats = {
        permissions, // Which cards the user can see
        userInfo: {
            accessLevel: user.accessLevel,
            organizationType: user.organizationType,
            organizationName: user.organization?.name || 'N/A',
            sectorName: user.sector?.name || 'N/A',
            departmentName: user.department?.name || 'N/A'
        }
    };

    // Only fetch and include data for cards the user has permission to view
    if (permissions.canViewOrganizations) {
        stats.totalOrganizations = await Organization.countDocuments(filter.organization);
    }

    if (permissions.canViewSectors) {
        stats.totalSectors = await Sector.countDocuments(filter.sector);
    }

    if (permissions.canViewDepartments) {
        stats.totalDepartments = await Department.countDocuments(filter.department);
    }

    if (permissions.canViewUsers) {
        stats.totalUsers = await User.countDocuments(filter.user);
    }

    if (permissions.canViewRoles) {
        stats.totalRoles = await Role.countDocuments(filter.role);
    }

    // Add detailed breakdowns for higher access levels
    if (permissions.canViewAdvancedStats) {
        if (permissions.canViewUsers) {
            stats.usersByAccessLevel = await getUsersByAccessLevel(filter.user);
            stats.usersByOrganization = await getUsersByOrganization(filter.user);
        }
    }

    return stats;
};

/**
 * Get user's permissions for dashboard cards
 * @param {Object} user - The authenticated user
 * @returns {Object} Permission flags for each dashboard card
 */
const getUserDashboardPermissions = async (user) => {
    // Super admin has all permissions
    if (user.accessLevel === 'super_admin') {
        return {
            canViewOrganizations: true,
            canViewSectors: true,
            canViewDepartments: true,
            canViewUsers: true,
            canViewRoles: true,
            canViewAdvancedStats: true
        };
    }

    // Initialize all permissions as false
    const permissions = {
        canViewOrganizations: false, // Restricted to Super Admin
        canViewSectors: false,       // Restricted to Super Admin
        canViewDepartments: false,
        canViewUsers: false,
        canViewRoles: false,         // Restricted to Super Admin
        canViewAdvancedStats: false
    };

    // If user has no roles, return all false
    if (!user.roles || user.roles.length === 0) {
        return permissions;
    }

    const roleIds = user.roles.map(r => r._id);

    // Define permission mappings
    // Note: Organizations, Sectors, and Roles are now restricted to Super Admin only on dashboard
    const permissionMappings = [
        { resource: 'department', action: 'view', flag: 'canViewDepartments' },
        { resource: 'user', action: 'view', flag: 'canViewUsers' }
    ];

    // Check each permission
    for (const mapping of permissionMappings) {
        const permission = await Permission.findOne({
            resource: mapping.resource,
            action: mapping.action
        });

        if (permission) {
            const hasPermission = await RolePermission.findOne({
                roleId: { $in: roleIds },
                permissionId: permission._id
            });

            if (hasPermission) {
                permissions[mapping.flag] = true;
            }
        }
    }

    // Advanced stats available for managers and above
    if (['manager', 'branch_admin', 'deputy'].includes(user.accessLevel)) {
        permissions.canViewAdvancedStats = true;
    }

    return permissions;
};

/**
 * Build MongoDB filter based on user's hierarchical position
 * @param {Object} user - The authenticated user
 * @returns {Object} Filters for different collections
 */
const buildHierarchyFilter = (user) => {
    const filters = {
        department: {},
        user: {},
        role: {},
        organization: {},
        sector: {}
    };

    // Super admin sees everything
    if (user.accessLevel === 'super_admin') {
        return filters;
    }

    // Filter by organization
    if (user.organization) {
        filters.department.organization = user.organization._id;
        filters.user.organization = user.organization._id;
        filters.organization._id = user.organization._id;
        filters.sector.organization = user.organization._id;
    }

    // Filter by sector (for head office users with sector assignment)
    if (user.sector && user.organizationType === 'head_office') {
        filters.department.sector = user.sector._id;
        filters.user.sector = user.sector._id;
        filters.sector._id = user.sector._id;
    }

    // Filter by department (for users assigned to specific department)
    if (user.department) {
        // Department-level users only see their department
        if (['expert', 'team_leader'].includes(user.accessLevel)) {
            filters.department._id = user.department._id;
            filters.user.department = user.department._id;
        }
    }

    // Directorate can see their managed departments
    if (user.accessLevel === 'directorate' && user.managedDepartments?.length > 0) {
        filters.department._id = { $in: user.managedDepartments.map(d => d._id) };
        filters.user.department = { $in: user.managedDepartments.map(d => d._id) };
    }

    // Team leader can see their managed teams
    if (user.accessLevel === 'team_leader' && user.managedTeams?.length > 0) {
        filters.user.team = { $in: user.managedTeams.map(t => t._id) };
    }

    // Branch admin sees all in their branch
    if (user.accessLevel === 'branch_admin' && user.organizationType === 'branch') {
        // Already filtered by organization above
    }

    // Filter roles based on organization type
    if (user.organizationType) {
        filters.role.type = user.organizationType;
    }

    return filters;
};

/**
 * Get user count grouped by access level
 * @param {Object} baseFilter - Base filter to apply
 * @returns {Array} User counts by access level
 */
const getUsersByAccessLevel = async (baseFilter) => {
    return await User.aggregate([
        { $match: baseFilter },
        {
            $group: {
                _id: '$accessLevel',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                accessLevel: '$_id',
                count: 1,
                _id: 0
            }
        }
    ]);
};

/**
 * Get user count grouped by organization
 * @param {Object} baseFilter - Base filter to apply
 * @returns {Array} User counts by organization
 */
const getUsersByOrganization = async (baseFilter) => {
    return await User.aggregate([
        { $match: baseFilter },
        {
            $group: {
                _id: '$organization',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'organizations',
                localField: '_id',
                foreignField: '_id',
                as: 'orgDetails'
            }
        },
        {
            $unwind: {
                path: '$orgDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                organizationId: '$_id',
                organizationName: '$orgDetails.name',
                count: 1,
                _id: 0
            }
        }
    ]);
};
