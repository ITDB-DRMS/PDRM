import Department from '../models/Department.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

export const getDashboardStats = async () => {
    const totalDepartments = await Department.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRoles = await Role.countDocuments();

    return {
        totalDepartments,
        totalUsers,
        totalRoles
    };
};
