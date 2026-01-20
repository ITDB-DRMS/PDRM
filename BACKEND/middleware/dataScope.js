import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';

/**
 * Middleware to apply data scope filtering based on user's hierarchy level
 */
export const applyScopeFilter = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('organization')
            .populate('sector')
            .populate('department')
            .populate('team')
            .populate('managedDepartments')
            .populate('managedTeams');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build scope filter based on access level
        const scope = {};

        switch (user.accessLevel) {
            case 'super_admin':
                // No restrictions - can see everything
                break;

            case 'manager':
                if (user.organizationType === 'head_office') {
                    // Can see all data across organization
                } else {
                    // Branch manager - only branch data
                    scope.organization = user.organization._id;
                }
                break;

            case 'deputy':
                // Can see all departments they manage
                if (user.managedDepartments && user.managedDepartments.length > 0) {
                    scope.department = { $in: user.managedDepartments.map(d => d._id) };
                }
                break;

            case 'sector_lead':
                if (user.sector) {
                    scope.sector = user.sector._id;
                }
                break;

            case 'branch_admin':
                // Branch-specific data only
                scope.organization = user.organization._id;
                break;

            case 'directorate':
                // Department-specific data
                if (user.managedDepartments && user.managedDepartments.length > 0) {
                    scope.department = { $in: user.managedDepartments.map(d => d._id) };
                } else if (user.department) {
                    scope.department = user.department._id;
                }
                break;

            case 'team_leader':
                // Team-specific data
                if (user.managedTeams && user.managedTeams.length > 0) {
                    scope.team = { $in: user.managedTeams.map(t => t._id) };
                } else if (user.team) {
                    scope.team = user.team._id;
                }
                break;

            case 'expert':
                // Only own data
                scope.createdBy = user._id;
                break;
        }

        req.dataScope = scope;
        req.scopedUser = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Scope filter failed', error: error.message });
    }
};

/**
 * Middleware to check if current user can access target user
 */
export const canAccessUser = async (req, res, next) => {
    try {
        const currentUser = await User.findById(req.user._id)
            .populate('organization')
            .populate('sector')
            .populate('department')
            .populate('team')
            .populate('managedDepartments')
            .populate('managedTeams');

        const targetUserId = req.params.userId || req.body.userId || req.params.id;

        if (!targetUserId) {
            return res.status(400).json({ message: 'Target user ID required' });
        }

        const targetUser = await User.findById(targetUserId)
            .populate('organization')
            .populate('sector')
            .populate('department')
            .populate('team');

        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }

        // Super admin can access anyone
        if (currentUser.accessLevel === 'super_admin') {
            req.targetUser = targetUser;
            return next();
        }

        // Manager can access anyone in their organization
        if (currentUser.accessLevel === 'manager') {
            if (currentUser.organizationType === 'head_office') {
                req.targetUser = targetUser;
                return next();
            }
            if (currentUser.organization && targetUser.organization &&
                currentUser.organization._id.equals(targetUser.organization._id)) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Deputy can access users in managed departments
        if (currentUser.accessLevel === 'deputy') {
            if (currentUser.managedDepartments && targetUser.department &&
                currentUser.managedDepartments.some(d => d._id.equals(targetUser.department._id))) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Sector Lead can access users in their sector
        if (currentUser.accessLevel === 'sector_lead') {
            if (currentUser.sector && targetUser.sector &&
                currentUser.sector._id.equals(targetUser.sector._id)) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Branch admin can access users in their branch
        if (currentUser.accessLevel === 'branch_admin') {
            if (currentUser.organization && targetUser.organization &&
                currentUser.organization._id.equals(targetUser.organization._id)) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Directorate can access users in their department
        if (currentUser.accessLevel === 'directorate') {
            if (currentUser.department && targetUser.department &&
                currentUser.department._id.equals(targetUser.department._id)) {
                req.targetUser = targetUser;
                return next();
            }
            // Also check managed departments
            if (currentUser.managedDepartments && targetUser.department &&
                currentUser.managedDepartments.some(d => d._id.equals(targetUser.department._id))) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Team leader can access team members
        if (currentUser.accessLevel === 'team_leader') {
            if (currentUser.team && targetUser.team &&
                currentUser.team._id.equals(targetUser.team._id)) {
                req.targetUser = targetUser;
                return next();
            }
            // Also check managed teams
            if (currentUser.managedTeams && targetUser.team &&
                currentUser.managedTeams.some(t => t._id.equals(targetUser.team._id))) {
                req.targetUser = targetUser;
                return next();
            }
        }

        // Expert can only access themselves
        if (currentUser._id.equals(targetUser._id)) {
            req.targetUser = targetUser;
            return next();
        }

        return res.status(403).json({
            message: 'Access denied to this user',
            currentLevel: currentUser.accessLevel,
            targetLevel: targetUser.accessLevel
        });
    } catch (error) {
        res.status(500).json({ message: 'Access check failed', error: error.message });
    }
};

/**
 * Get accessible organizations for current user
 */
export const getAccessibleOrganizations = async (userId) => {
    const user = await User.findById(userId).populate('organization');

    if (user.accessLevel === 'super_admin' ||
        (user.accessLevel === 'manager' && user.organizationType === 'head_office')) {
        return await Organization.find({ status: 'active' });
    }

    if (user.organization) {
        return [user.organization];
    }

    return [];
};

/**
 * Get accessible departments for current user
 */
export const getAccessibleDepartments = async (userId) => {
    const user = await User.findById(userId)
        .populate('organization')
        .populate('department')
        .populate('managedDepartments');

    if (user.accessLevel === 'super_admin' ||
        (user.accessLevel === 'manager' && user.organizationType === 'head_office')) {
        return await Department.find({});
    }

    if (user.accessLevel === 'manager' || user.accessLevel === 'branch_admin') {
        return await Department.find({ organizationId: user.organization._id });
    }

    if (user.accessLevel === 'deputy' || user.accessLevel === 'directorate') {
        if (user.managedDepartments && user.managedDepartments.length > 0) {
            return user.managedDepartments;
        }
        if (user.department) {
            return [user.department];
        }
    }

    if (user.department) {
        return [user.department];
    }

    return [];
};
