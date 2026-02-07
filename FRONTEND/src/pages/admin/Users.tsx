import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Can } from '../../components/auth/PermissionGuard';
import { LayoutGrid, List, Search, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UserCard } from '../../components/admin/UserCard';
import { UserStats } from '../../components/admin/UserStats';

interface User {
    id: string;
    fullname: string;
    email: string;
    phone?: string;
    roles?: { id: string; name: string }[];
    department?: { id: string; name: string };
    organization?: { id: string; name: string };
    sector?: { id: string; name: string };
    team?: { id: string; name: string };
    status: string;
    profileImage?: string;
    accessLevel: string;
    organizationType: string;
}

interface Option {
    id?: string;
    _id?: string;
    name: string;
    organizationId?: string | { _id: string } | any; // Handle populated or string ID
    sectorId?: string | { _id: string } | any;
    department?: string | { _id: string } | any;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-emerald-500';
        case 'pending': return 'bg-amber-500';
        case 'suspended': return 'bg-rose-500';
        default: return 'bg-slate-500';
    }
};

const DiamondBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Mesh Gradient Base */}
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0A0A0B]" />

        {/* Floating Glassy Diamonds */}
        {[...Array(10)].map((_, i) => (
            <motion.div
                key={i}
                initial={{
                    opacity: 0,
                    rotate: 45,
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%"
                }}
                animate={{
                    opacity: [0.15, 0.45, 0.15],
                    y: ["-20%", "120%"],
                    rotate: [45, 225],
                }}
                transition={{
                    duration: 20 + Math.random() * 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * -4
                }}
                className="absolute h-64 w-64 rounded-[48px] border border-white/40 bg-white/10 backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.04]"
                style={{
                    left: `${(i * 12) % 95}%`,
                }}
            />
        ))}

    </div>
);

export default function Users() {
    const { user } = useAuth();

    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Option[]>([]);

    // Options Data
    const [allOrganizations, setAllOrganizations] = useState<Option[]>([]);
    const [allSectors, setAllSectors] = useState<Option[]>([]);
    const [allDepartments, setAllDepartments] = useState<Option[]>([]);
    const [allTeams, setAllTeams] = useState<Option[]>([]);

    // Filtered Options for Form
    const [departments, setDepartments] = useState<Option[]>([]);
    const [sectors, setSectors] = useState<Option[]>([]);
    const [teams, setTeams] = useState<Option[]>([]);

    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);

    // Role Modal State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [userForRoles, setUserForRoles] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',

        roles: [] as string[],
        organization: '',
        sector: '',
        department: '',
        team: '',
        status: 'active',
        profileImage: null as File | null,
        accessLevel: 'public',
        organizationType: 'branch'
    });

    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    // --- Cascading Filter Logic ---

    // 1. Filter Sectors based on Organization
    useEffect(() => {
        // Only run logic if form is open (optimization) or always
        if (formData.organization) {
            const relevantSectors = allSectors.filter(s => {
                if (!s.organizationId) return false;
                const orgId = typeof s.organizationId === 'object' ? (s.organizationId as any)._id || (s.organizationId as any).id : s.organizationId;
                return orgId === formData.organization;
            });
            setSectors(relevantSectors);
        } else {
            setSectors([]);
        }
    }, [formData.organization, allSectors]);

    // 2. Filter Departments based on Sector OR Organization
    useEffect(() => {
        if (formData.sector) {
            // If Sector is selected, show Departments in that Sector
            const relevantDepts = allDepartments.filter(d => {
                if (!d.sectorId) return false;
                const secId = typeof d.sectorId === 'object' ? (d.sectorId as any)._id || (d.sectorId as any).id : d.sectorId;
                return secId === formData.sector;
            });
            setDepartments(relevantDepts);
        } else if (formData.organization) {
            // If Only Org selected (and no sector, or sector not applicable), show direct depts or all depts in org
            const relevantDepts = allDepartments.filter(d => {
                const orgId = typeof d.organizationId === 'object' && d.organizationId !== null
                    ? (d.organizationId as any)._id || (d.organizationId as any).id
                    : d.organizationId;
                return orgId === formData.organization;
            });
            setDepartments(relevantDepts);
        } else {
            setDepartments([]);
        }
    }, [formData.organization, formData.sector, allDepartments]);

    // 3. Filter Teams based on Department
    useEffect(() => {
        if (formData.department) {
            const relevantTeams = allTeams.filter(t => {
                if (!t.department) return false;
                const deptId = typeof t.department === 'object' ? (t.department as any)._id || (t.department as any).id : t.department;
                return deptId === formData.department;
            });
            setTeams(relevantTeams);
        } else {
            setTeams([]);
        }
    }, [formData.department, allTeams]);




    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [roleRes, orgRes, sectRes, deptRes, teamRes] = await Promise.all([
                api.get('/roles'),
                api.get('/organizations'),
                api.get('/sectors'),
                api.get('/departments'), // Assuming this returns all departments
                api.get('/teams') // Assuming this returns all teams
            ]);
            setRoles(roleRes.data);
            setAllOrganizations(orgRes.data);
            setAllSectors(sectRes.data.data || sectRes.data); // Handle {data: []} vs []
            setAllDepartments(deptRes.data);
            setAllTeams(teamRes.data.data || teamRes.data);
        } catch (e) {
            console.error("Failed to fetch options", e);
        }
    }

    const handleOpenModal = (userItem?: User, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');

        // Determine Branch Admin context
        const isBranchAdmin = user?.accessLevel === 'branch_admin' ||
            user?.roles?.some(r => ['Branch Admin', 'branch_admin'].includes(r.name));
        const isSuperAdmin = user?.accessLevel === 'super_admin' ||
            user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name));

        // Get user's org ID if branch admin
        let userOrgId = '';
        if (isBranchAdmin && !isSuperAdmin && user?.organization) {
            userOrgId = typeof user.organization === 'object' ? (user.organization as any)._id || (user.organization as any).id : user.organization;
        }

        if (userItem) {
            setEditUser(userItem);
            setFormData({
                fullname: userItem.fullname,
                email: userItem.email,
                phone: userItem.phone || '',

                roles: userItem.roles?.map((r: any) => r._id || r.id) || [],
                organization: (userItem.organization as any)?._id || userItem.organization?.id || '',
                sector: (userItem.sector as any)?._id || userItem.sector?.id || '',
                department: (userItem.department as any)?._id || userItem.department?.id || '',
                team: (userItem.team as any)?._id || userItem.team?.id || '',
                status: userItem.status,
                profileImage: null,
                accessLevel: userItem.accessLevel || 'expert',
                organizationType: userItem.organizationType || 'branch'
            });
        } else {
            setEditUser(null);
            setFormData({
                fullname: '',
                email: '',
                phone: '',

                roles: [],
                organization: userOrgId, // Pre-fill
                sector: '',
                department: '',
                team: '',
                status: 'active',
                profileImage: null,
                accessLevel: 'public',
                organizationType: userOrgId ? 'branch' : 'branch'
            });
        }
        openModal();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        try {
            const data = new FormData();
            data.append('fullname', formData.fullname);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('accessLevel', formData.accessLevel);
            data.append('organizationType', formData.organizationType);


            formData.roles.forEach(role => data.append('roles', role));

            // Append hierarchical fields if they have values
            if (formData.organization) data.append('organization', formData.organization);
            if (formData.sector) data.append('sector', formData.sector);
            if (formData.department) data.append('department', formData.department);
            if (formData.team) data.append('team', formData.team);

            data.append('status', formData.status);
            if (formData.profileImage) {
                data.append('profileImage', formData.profileImage);
            }

            if (editUser) {
                await api.put(`/users/${editUser.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                closeModal();
                toast.success('User updated successfully');
            } else {
                await api.post('/users', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                closeModal();
                toast.success('User created successfully');
            }
            fetchData();
        } catch (error: any) {
            console.error("Failed to save user", error);
            // Close the form modal and show error popup
            closeModal();
            toast.error(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/users/${id}`);
                toast.success('User deleted successfully');
                fetchData();
            } catch (error: any) {
                console.error("Failed to delete user", error);
                toast.error('Failed to delete user');
            }
        }
    };

    // Helper to determine which fields to show
    const shouldShowField = (fieldName: 'organization' | 'sector' | 'department' | 'team') => {
        const level = formData.accessLevel;
        // Always show organization for everyone (except super_admin maybe? but even they belong somewhere usually)
        if (fieldName === 'organization') return true;

        // Sector Logic
        if (fieldName === 'sector') {
            return ['sector_lead', 'directorate', 'team_leader', 'expert'].includes(level);
        }

        // Department Logic
        if (fieldName === 'department') {
            return ['directorate', 'team_leader', 'expert'].includes(level);
        }

        // Team Logic
        if (fieldName === 'team') {
            return ['team_leader', 'expert'].includes(level);
        }

        return false;
    };

    const handleOpenRoleModal = (user: User) => {
        setUserForRoles(user);
        setSelectedRoles(user.roles?.map((r: any) => r._id || r.id) || []);
        setIsRoleModalOpen(true);
    };

    const handleSaveRoles = async () => {
        if (!userForRoles) return;
        try {
            // We need a specific endpoint to update roles, or use the update user endpoint
            // Assuming update user endpoint handles roles update
            const data = {
                roles: selectedRoles
            };

            await api.put(`/users/${userForRoles.id}/roles`, data); // Try specific endpoint first or fallback to general update
            // If backend doesn't have specific route, we might need to send all user data back or modify backend.
            // Let's assume standard update for now if specific fails, but cleaner to separate.
            // Actually, based on previous code, we used Put /users/:id with FormData.
            // Let's stick to that pattern or simpler JSON if backend supports partial updates.
            // Using a specialized endpoint is safer if exists. If not, we'll try partial update.

            toast.success('Roles updated successfully');
            setIsRoleModalOpen(false);
            fetchData();
        } catch (error: any) {
            // If 404, maybe endpoint doesn't exist, try general update
            if (error.response && error.response.status === 404) {
                try {
                    const data = { roles: selectedRoles };
                    await api.put(`/users/${userForRoles.id}`, data);
                    toast.success('Roles updated successfully');
                    setIsRoleModalOpen(false);
                    fetchData();
                    return;
                } catch (e) {
                    console.error("Failed to update roles fallback", e);
                }
            }
            console.error("Failed to update roles", error);
            toast.error('Failed to update roles');
        }
    };

    return (
        <>
            <PageMeta
                title="User Management | IDRMIS"
                description="Manage system users"
            />
            <PageBreadcrumb pageTitle="Users" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />
                {/* Stats Overview */}
                <UserStats users={users} />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                User Directory
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Manage system access and permissions</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Unified Search & Actions */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-full rounded-2xl border border-white/20 bg-white/40 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white min-w-[280px]"
                                />
                            </div>

                            <div className="flex items-center rounded-2xl border border-slate-200 bg-white/40 p-1 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>

                            <Can resource="User" action="create">
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] dark:bg-primary dark:shadow-primary/20"
                                >
                                    <Plus size={18} />
                                    Add User
                                </button>
                            </Can>
                        </div>
                    </div>

                    {/* Filters Strip */}
                    <div className="mb-8 flex flex-wrap gap-3 border-b border-slate-200 pb-6 dark:border-white/5">
                        {['all', 'active', 'pending', 'suspended'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`rounded-xl border px-4 py-2 text-xs font-medium transition-all ${statusFilter === status
                                    ? 'border-primary/50 bg-primary/20 text-primary'
                                    : 'border-white/20 bg-white/20 text-slate-600 hover:border-white/40 hover:bg-white/40 dark:border-white/5 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/10 dark:hover:text-white'}`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Results Count */}
                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {users.filter(u =>
                            (statusFilter === 'all' || u.status === statusFilter) &&
                            (u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).length} users
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {viewMode === 'grid' ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                                >
                                    {users
                                        .filter(u => (statusFilter === 'all' || u.status === statusFilter))
                                        .filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((user) => (
                                            <UserCard
                                                key={user.id}
                                                user={user}
                                                onEdit={() => handleOpenModal(user, 'edit')}
                                                onView={() => handleOpenModal(user, 'view')}
                                                onDelete={handleDelete}
                                                onStatusToggle={async (u) => {
                                                    const newStatus = u.status === 'active' ? 'suspended' : 'active';
                                                    if (confirm(`Change status to ${newStatus}?`)) {
                                                        try {
                                                            await api.put(`/users/${u.id}`, { status: newStatus });
                                                            toast.success(`User marked as ${newStatus}`);
                                                            fetchData();
                                                        } catch (error) { toast.error('Failed to update status'); }
                                                    }
                                                }}
                                            />
                                        ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="table"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="max-w-full overflow-x-auto rounded-2xl border border-white/5"
                                >
                                    <table className="w-full table-auto">
                                        <thead>
                                            <tr className="bg-white/40 text-left dark:bg-white/5">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">User</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Details</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Level</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Status</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {users
                                                .filter(u => (statusFilter === 'all' || u.status === statusFilter))
                                                .filter(u => u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((user) => (
                                                    <tr key={user.id} className="group hover:bg-white/60 transition-colors dark:hover:bg-white/[0.02]">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                    {user.fullname.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-slate-900 group-hover:text-primary transition-colors dark:text-white">{user.fullname}</div>
                                                                    <div className="text-xs text-slate-500 dark:text-white/40">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-[200px] truncate text-xs text-slate-600 dark:text-white/60">
                                                                {user.organization?.name}
                                                                {user.department && <span className="block text-slate-400 dark:text-white/30">{user.department.name}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 uppercase tracking-tight dark:bg-white/5 dark:text-white/70">
                                                                {user.accessLevel?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)} shadow-lg shadow-${getStatusColor(user.status).split('-')[1]}/20`} />
                                                                <span className="text-xs font-medium text-slate-700 dark:text-white/70 uppercase">
                                                                    {user.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => handleOpenModal(user, 'view')} title="View Details" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button onClick={() => handleOpenModal(user, 'edit')} title="Edit User" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(user.id)} title="Delete User" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View User' : editUser ? 'Edit User' : 'Add New User'}
                        </h4>
                    </div>
                    <form onSubmit={handleSave} className="flex flex-col">
                        <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Full Name</Label>
                                        <Input
                                            type="text"
                                            value={formData.fullname}
                                            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                            required
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {/* Access Level First to drive UI */}
                                    <div>
                                        <Label>Access Level</Label>
                                        <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                            <select
                                                value={formData.accessLevel}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, accessLevel: e.target.value });
                                                }}
                                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter"
                                                disabled={isViewMode}
                                            >
                                                <option value="public">Public</option>
                                                <option value="expert">Expert</option>
                                                <option value="team_leader">Team Leader</option>
                                                <option value="directorate">Directorate (Department Lead)</option>
                                                <option value="sector_lead">Sector Lead</option>
                                                <option value="branch_admin">Branch Admin</option>
                                                <option value="deputy">Deputy</option>
                                                <option value="manager">Manager</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Hierarchical Context</h5>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Organization Type</Label>
                                            <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                                <select
                                                    value={formData.organizationType}
                                                    onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter"
                                                    disabled={isViewMode}
                                                >
                                                    <option value="head_office">Head Office</option>
                                                    <option value="branch">Branch</option>
                                                </select>
                                            </div>
                                        </div>

                                        {shouldShowField('organization') && (
                                            <div>
                                                <Label>Organization</Label>
                                                <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                                    <select
                                                        value={formData.organization}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            organization: e.target.value,
                                                            sector: '',
                                                            department: '',
                                                            team: ''
                                                        })}
                                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter"
                                                        disabled={isViewMode || (user?.accessLevel === 'branch_admin' && !user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name)) && !!formData.organization)}
                                                    >
                                                        <option value="">Select Organization</option>
                                                        {allOrganizations.map(o => <option key={o._id || o.id} value={o._id || o.id}>{o.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {shouldShowField('sector') && (
                                            <div>
                                                <Label>Sector</Label>
                                                <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                                    <select
                                                        value={formData.sector}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            sector: e.target.value,
                                                            department: '',
                                                            team: ''
                                                        })}
                                                        disabled={isViewMode || !formData.organization}
                                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter disabled:opacity-50"
                                                    >
                                                        <option value="">Select Sector</option>
                                                        {sectors.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {shouldShowField('department') && (
                                            <div>
                                                <Label>Department</Label>
                                                <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                                    <select
                                                        value={formData.department}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            department: e.target.value,
                                                            team: ''
                                                        })}
                                                        disabled={isViewMode || !formData.organization}
                                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter disabled:opacity-50"
                                                    >
                                                        <option value="">Select Department</option>
                                                        {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {shouldShowField('team') && (
                                        <div>
                                            <Label>Team</Label>
                                            <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                                <select
                                                    value={formData.team}
                                                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                                    disabled={isViewMode || !formData.department}
                                                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter disabled:opacity-50"
                                                >
                                                    <option value="">Select Team</option>
                                                    {teams.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label>Status</Label>
                                    <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-whiter"
                                            disabled={isViewMode}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>Profile Image</Label>

                                    {/* Image Preview */}
                                    {(formData.profileImage || editUser?.profileImage) && (
                                        <div className="mb-2">
                                            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                                                <img
                                                    src={
                                                        formData.profileImage instanceof File
                                                            ? URL.createObjectURL(formData.profileImage)
                                                            : editUser?.profileImage
                                                    }
                                                    alt="Profile Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFormData({ ...formData, profileImage: e.target.files[0] });
                                            }
                                        }}
                                        className="w-full cursor-pointer rounded-lg border border-stroke bg-transparent py-3 pl-5 pr-5 font-normal text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:text-white dark:focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90 disabled:cursor-default"
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal} type="button">
                                {isViewMode ? 'Close' : 'Cancel'}
                            </Button>
                            {!isViewMode && (
                                <Button size="sm" type="submit">
                                    Save
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Role Assignment Modal */}
            <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} className="max-w-[500px] m-4">
                <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10">
                    <h4 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Manage Roles for {userForRoles?.fullname}
                    </h4>

                    <div className="mb-6">
                        <Label>Select Roles</Label>
                        <div className="relative z-20 bg-transparent dark:bg-gray-800">
                            <select
                                multiple
                                value={selectedRoles}
                                onChange={(e) => {
                                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                    setSelectedRoles(selectedOptions);
                                }}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary h-60"
                            >
                                {roles.map(r => <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveRoles}>
                            Save Roles
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
