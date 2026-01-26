import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import {
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    Team
} from '../../api/teamService';
import { getDepartments, Department } from '../../api/departmentService';
import { DirectorateAndAbove } from '../../components/auth/AccessControl';
import { useHierarchy } from '../../context/HierarchyContext';
import { Can } from '../../components/auth/PermissionGuard';

import { useAuth } from '../../context/AuthContext';

export default function Teams() {
    const { user } = useAuth();
    // ... existing state
    const [teams, setTeams] = useState<Team[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [editTeam, setEditTeam] = useState<Team | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', department: '' });

    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();
    const { accessLevel } = useHierarchy();

    useEffect(() => {
        fetchData();
    }, [user]); // Add user dependence

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamsData, depsData] = await Promise.all([
                getTeams(),
                getDepartments()
            ]);
            setTeams(teamsData || []);

            // Filter Departments if Branch Admin
            const isBranchAdmin = user?.accessLevel === 'branch_admin' ||
                user?.roles?.some(r => ['Branch Admin', 'branch_admin'].includes(r.name));

            const isSuperAdmin = user?.accessLevel === 'super_admin' ||
                user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name));

            if (isBranchAdmin && !isSuperAdmin && user?.organization && depsData) {
                const orgId = typeof user.organization === 'object' ? (user.organization as any)._id || (user.organization as any).id : user.organization;

                const filteredDeps = depsData.filter((d: any) => {
                    const dOrgId = typeof d.organizationId === 'object' ? d.organizationId._id || d.organizationId.id : d.organizationId;
                    return dOrgId === orgId;
                });
                setDepartments(filteredDeps);
            } else {
                setDepartments(depsData || []);
            }

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (team?: Team, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        if (team) {
            setEditTeam(team);
            setFormData({
                name: team.name,
                description: team.description || '',
                department: team.department as string
            });
        } else {
            setEditTeam(null);
            setFormData({ name: '', description: '', department: '' });
        }
        openModal();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editTeam) {
                await updateTeam(editTeam._id || editTeam.id!, formData);
            } else {
                await createTeam(formData);
            }
            closeModal();
            toast.success(editTeam ? 'Team updated successfully' : 'Team created successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to save team', error);
            toast.error('Failed to save team');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this team?')) {
            try {
                await deleteTeam(id);
                toast.success('Team deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Failed to delete team', error);
                toast.error('Failed to delete team');
            }
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <>
            <PageMeta
                title="Team Management | IDRMIS"
                description="Manage teams and team members"
            />
            <PageBreadcrumb pageTitle="Teams" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        All Teams
                    </h3>
                    <Can resource="Team" action="create">
                        <Button size="sm" onClick={() => handleOpenModal()}>
                            + Add Team
                        </Button>
                    </Can>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                    Team Name
                                </th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                    Department
                                </th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                    Team Leader
                                </th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                                    Members
                                </th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                                    Status
                                </th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team) => (
                                <tr key={team._id || team.id}>
                                    <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{team.name}</h5>
                                        {team.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{team.description}</p>
                                        )}
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {team.department && typeof team.department === 'object' ? (team.department as any).name : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {team.teamLeader ? team.teamLeader.fullname : 'Not assigned'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {team.members?.length || 0}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${team.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                            {team.status}
                                        </span>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <Can resource="Team" action="view">
                                                <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleOpenModal(team, 'view')} title="View">
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 13.5C6.075 13.5 3.51563 11.6437 2.475 9C3.51563 6.35625 6.075 4.5 9 4.5C11.925 4.5 14.4844 6.35625 15.525 9C14.4844 11.6437 11.925 13.5 9 13.5ZM9 5.625C7.14375 5.625 5.625 7.14375 5.625 9C5.625 10.8562 7.14375 12.375 9 12.375C10.8562 12.375 12.375 10.8562 12.375 9C12.375 7.14375 10.8562 5.625 9 5.625ZM9 10.5C8.15625 10.5 7.5 9.84375 7.5 9C7.5 8.15625 8.15625 7.5 9 7.5C9.84375 7.5 10.5 8.15625 10.5 9C10.5 9.84375 9.84375 10.5 9 10.5Z" fill="" />
                                                    </svg>
                                                </button>
                                            </Can>
                                            <Can resource="Team" action="update">
                                                <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleOpenModal(team, 'edit')} title="Edit">
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13.7531 2.475C13.2469 1.96875 12.4312 1.96875 11.925 2.475L10.3781 4.02188L13.9781 7.62188L15.525 6.075C16.0312 5.56875 16.0312 4.75313 15.525 4.24688L13.7531 2.475ZM9.225 5.175L2.69999 11.7C2.53124 11.8688 2.44687 12.0938 2.44687 12.3188V15.525C2.44687 15.6938 2.58749 15.8344 2.75624 15.8344H5.96249C6.18749 15.8344 6.41249 15.75 6.58124 15.5813L13.1062 9.05625L9.225 5.175Z" fill="" />
                                                    </svg>
                                                </button>
                                            </Can>
                                            <Can resource="Team" action="delete">
                                                <button className="hover:text-red-500 text-gray-600 dark:text-gray-300" onClick={() => handleDelete(team._id || team.id!)} title="Delete">
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13.7531 2.47502H11.3062V1.9969C11.3062 1.15315 10.6312 0.478149 9.78749 0.478149H8.21249C7.36874 0.478149 6.69374 1.15315 6.69374 1.9969V2.47502H4.24687C3.74062 2.47502 3.37499 2.8969 3.37499 3.40315V3.9094C3.37499 4.07815 3.51561 4.21877 3.68436 4.21877H14.3156C14.4844 4.21877 14.625 4.07815 14.625 3.9094V3.40315C14.625 2.8969 14.2594 2.47502 13.7531 2.47502ZM7.67811 1.9969C7.67811 1.68752 7.93124 1.4344 8.21249 1.4344H9.78749C10.0687 1.4344 10.3219 1.68752 10.3219 1.9969V2.47502H7.70624V1.9969H7.67811Z" fill="" />
                                                        <path d="M14.2312 5.20313H3.76874C3.59999 5.20313 3.45936 5.34375 3.48749 5.5125L4.41561 16.4812C4.47186 17.2406 5.11874 17.8031 5.87811 17.8031H12.1219C12.8812 17.8031 13.5281 17.2406 13.5844 16.4812L14.5125 5.5125C14.5406 5.34375 14.4 5.20313 14.2312 5.20313ZM8.21249 14.9906H7.22811C6.94686 14.9906 6.72186 14.7656 6.72186 14.4844V8.52188C6.72186 8.24063 6.94686 8.01563 7.22811 8.01563H8.21249C8.49374 8.01563 8.71874 8.24063 8.71874 8.52188V14.4844C8.71874 14.7656 8.49374 14.9906 8.21249 14.9906ZM11.2781 14.4844C11.2781 14.7656 11.0531 14.9906 10.7719 14.9906H9.78749C9.50624 14.9906 9.28124 14.7656 9.28124 14.4844V8.52188C9.28124 8.24063 9.50624 8.01563 9.78749 8.01563H10.7719C11.0531 8.01563 11.2781 8.24063 11.2781 8.52188V14.4844Z" fill="" />
                                                    </svg>
                                                </button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teams.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No teams found. Create your first team to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Team' : editTeam ? 'Edit Team' : 'Add New Team'}
                        </h4>
                    </div>
                    <form onSubmit={handleSave} className="flex flex-col">
                        <div className="custom-scrollbar h-auto overflow-y-auto px-2 pb-3">
                            <div className="space-y-5">
                                <div>
                                    <Label>Team Name</Label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div>
                                    <Label>Department</Label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                        disabled={isViewMode}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
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
        </>
    );
}
