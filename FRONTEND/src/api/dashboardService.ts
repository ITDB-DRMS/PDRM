import api from './axios';

export interface DashboardStats {
    totalDepartments: number;
    totalUsers: number;
    totalRoles: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};
