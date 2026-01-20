import React, { useState, useEffect } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";


import api from '../../api/axios';

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

export default function Users() {
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
    const [alertState, setAlertState] = useState<{ show: boolean; variant: "success" | "error" | "warning" | "info"; title: string; message: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        password: '',
        roles: [] as string[],
        organization: '',
        sector: '',
        department: '',
        team: '',
        status: 'active',
        profileImage: null as File | null,
        accessLevel: 'expert',
        organizationType: 'branch'
    });

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


    // Auto-dismiss alert
    useEffect(() => {
        if (alertState?.show) {
            const timer = setTimeout(() => {
                setAlertState(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alertState]);

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

    const handleOpenModal = (user?: User, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        if (user) {
            setEditUser(user);
            setFormData({
                fullname: user.fullname,
                email: user.email,
                phone: user.phone || '',
                password: '',
                roles: user.roles?.map(r => r.id) || [],
                organization: user.organization?.id || '',
                sector: user.sector?.id || '',
                department: user.department?.id || '',
                team: user.team?.id || '',
                status: user.status,
                profileImage: null,
                accessLevel: user.accessLevel || 'expert',
                organizationType: user.organizationType || 'branch'
            });
        } else {
            setEditUser(null);
            setFormData({
                fullname: '',
                email: '',
                phone: '',
                password: '',
                roles: [],
                organization: '',
                sector: '',
                department: '',
                team: '',
                status: 'active',
                profileImage: null,
                accessLevel: 'expert',
                organizationType: 'branch'
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

            if (formData.password) data.append('password', formData.password);
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
                setAlertState({ show: true, variant: 'success', title: 'Success', message: 'User updated successfully' });
            } else {
                await api.post('/users', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                closeModal();
                setAlertState({ show: true, variant: 'success', title: 'Success', message: 'User created successfully' });
            }
            fetchData();
        } catch (error: any) {
            console.error("Failed to save user", error);
            // Close the form modal and show error popup
            closeModal();
            setAlertState({ show: true, variant: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to save user' });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/users/${id}`);
                setAlertState({ show: true, variant: 'success', title: 'Success', message: 'User deleted successfully' });
                fetchData();
            } catch (error: any) {
                console.error("Failed to delete user", error);
                setAlertState({ show: true, variant: 'error', title: 'Error', message: 'Failed to delete user' });
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

    return (
        <>
            <PageMeta
                title="User Management | IDRMIS"
                description="Manage system users"
            />
            <PageBreadcrumb pageTitle="Users" />

            {/* Alert popup modal for success / error */}
            {alertState?.show && (
                <Modal isOpen={true} onClose={() => setAlertState(null)} className="max-w-[480px] m-4">
                    <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
                        <div className="mb-4">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{alertState.title}</h4>
                            <p className={`mt-2 text-sm ${alertState.variant === 'success' ? 'text-green-600' : 'text-red-600'}`}>{alertState.message}</p>
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={() => setAlertState(null)} type="button">Close</Button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        All Users
                    </h3>
                    <Button size="sm" onClick={() => handleOpenModal()}>
                        + Add User
                    </Button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading users...</div>
                    ) : (
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                        Full Name
                                    </th>
                                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                        Email
                                    </th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                                        Context
                                    </th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                                        Access Level
                                    </th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                                            <h5 className="font-medium text-black dark:text-white">{user.fullname}</h5>
                                            <p className="text-sm text-gray-500">{user.phone}</p>
                                        </td>
                                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                            <p className="text-black dark:text-white">{user.email}</p>
                                        </td>
                                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                            <div className="text-sm">
                                                {user.organization && <p className='text-gray-600 dark:text-gray-400'>Org: {user.organization.name}</p>}
                                                {user.sector && <p className='text-gray-600 dark:text-gray-400'>Sec: {user.sector.name}</p>}
                                                {user.department && <p className='text-gray-600 dark:text-gray-400'>Dept: {user.department.name}</p>}
                                                {user.team && <p className='text-gray-600 dark:text-gray-400'>Team: {user.team.name}</p>}
                                            </div>
                                        </td>
                                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                                {user.accessLevel?.replace('_', ' ') || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                            <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${user.status === 'active' ? 'bg-success text-success' :
                                                user.status === 'pending' ? 'bg-warning text-warning' : 'bg-danger text-danger'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                            <div className="flex items-center space-x-3.5">
                                                <button
                                                    onClick={() => handleOpenModal(user, 'view')}
                                                    className="hover:text-primary text-gray-600 dark:text-gray-300"
                                                    title="View"
                                                >
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 13.5C6.075 13.5 3.51563 11.6437 2.475 9C3.51563 6.35625 6.075 4.5 9 4.5C11.925 4.5 14.4844 6.35625 15.525 9C14.4844 11.6437 11.925 13.5 9 13.5ZM9 5.625C7.14375 5.625 5.625 7.14375 5.625 9C5.625 10.8562 7.14375 12.375 9 12.375C10.8562 12.375 12.375 10.8562 12.375 9C12.375 7.14375 10.8562 5.625 9 5.625ZM9 10.5C8.15625 10.5 7.5 9.84375 7.5 9C7.5 8.15625 8.15625 7.5 9 7.5C9.84375 7.5 10.5 8.15625 10.5 9C10.5 9.84375 9.84375 10.5 9 10.5Z" fill="" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(user, 'edit')}
                                                    className="hover:text-primary text-gray-600 dark:text-gray-300"
                                                    title="Edit"
                                                >
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13.7531 2.475C13.2469 1.96875 12.4312 1.96875 11.925 2.475L10.3781 4.02188L13.9781 7.62188L15.525 6.075C16.0312 5.56875 16.0312 4.75313 15.525 4.24688L13.7531 2.475ZM9.225 5.175L2.69999 11.7C2.53124 11.8688 2.44687 12.0938 2.44687 12.3188V15.525C2.44687 15.6938 2.58749 15.8344 2.75624 15.8344H5.96249C6.18749 15.8344 6.41249 15.75 6.58124 15.5813L13.1062 9.05625L9.225 5.175Z" fill="" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="hover:text-red-500 text-gray-600 dark:text-gray-300"
                                                    title="Delete"
                                                >
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13.7531 2.47502H11.3062V1.9969C11.3062 1.15315 10.6312 0.478149 9.78749 0.478149H8.21249C7.36874 0.478149 6.69374 1.15315 6.69374 1.9969V2.47502H4.24687C3.74062 2.47502 3.37499 2.8969 3.37499 3.40315V3.9094C3.37499 4.07815 3.51561 4.21877 3.68436 4.21877H14.3156C14.4844 4.21877 14.625 4.07815 14.625 3.9094V3.40315C14.625 2.8969 14.2594 2.47502 13.7531 2.47502ZM7.67811 1.9969C7.67811 1.68752 7.93124 1.4344 8.21249 1.4344H9.78749C10.0687 1.4344 10.3219 1.68752 10.3219 1.9969V2.47502H7.70624V1.9969H7.67811Z" fill="" />
                                                        <path d="M14.2312 5.20313H3.76874C3.59999 5.20313 3.45936 5.34375 3.48749 5.5125L4.41561 16.4812C4.47186 17.2406 5.11874 17.8031 5.87811 17.8031H12.1219C12.8812 17.8031 13.5281 17.2406 13.5844 16.4812L14.5125 5.5125C14.5406 5.34375 14.4 5.20313 14.2312 5.20313ZM8.21249 14.9906H7.22811C6.94686 14.9906 6.72186 14.4844V8.52188C6.72186 8.24063 6.94686 8.01563 7.22811 8.01563H8.21249C8.49374 8.01563 8.71874 8.24063 8.71874 8.52188V14.4844C8.71874 14.7656 8.49374 14.9906 8.21249 14.9906ZM11.2781 14.4844C11.2781 14.7656 11.0531 14.9906 10.7719 14.9906H9.78749C9.50624 14.9906 9.28124 14.7656 9.28124 14.4844V8.52188C9.28124 8.24063 9.50624 8.01563 9.78749 8.01563H10.7719C11.0531 8.01563 11.2781 8.24063 11.2781 8.52188V14.4844Z" fill="" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
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
                                                <option value="super_admin">Super Admin</option>
                                                <option value="manager">Manager</option>
                                                <option value="deputy">Deputy</option>
                                                <option value="sector_lead">Sector Lead</option>
                                                <option value="directorate">Directorate (Department Lead)</option>
                                                <option value="branch_admin">Branch Admin</option>
                                                <option value="team_leader">Team Leader</option>
                                                <option value="expert">Expert</option>
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
                                                        disabled={isViewMode}
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
                                    <Label>Roles</Label>
                                    <div className="relative z-20 bg-transparent dark:bg-gray-800">
                                        <select
                                            multiple
                                            value={formData.roles}
                                            onChange={(e) => {
                                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                setFormData({ ...formData, roles: selectedOptions });
                                            }}
                                            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary h-24 disabled:cursor-default disabled:bg-whiter"
                                            disabled={isViewMode}
                                        >
                                            {roles.map(r => <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>)}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles</p>
                                    </div>
                                </div>

                                {!editUser && (
                                    <div>
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editUser}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                )}

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
                </div >
            </Modal >
        </>
    );
}
