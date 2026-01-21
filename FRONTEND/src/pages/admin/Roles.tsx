import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Role, getRoles, createRole, updateRole, deleteRole, assignPermissionToRole, removePermissionFromRole, getRolePermissions } from '../../api/roleService';
import { Permission, getPermissions } from '../../api/permissionService';

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editRole, setEditRole] = useState<Role | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [initialPermissions, setInitialPermissions] = useState<string[]>([]);

    const [viewRole, setViewRole] = useState<Role | null>(null);
    const [viewPermissions, setViewPermissions] = useState<Permission[]>([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                getRoles(),
                getPermissions()
            ]);
            setRoles(rolesRes || []);
            setPermissions(permsRes || []);
        } catch (error) {
            console.error("Failed to fetch roles/permissions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async (role?: any) => {
        if (role) {
            setEditRole(role);
            setFormData({ name: role.name, description: role.description });
            try {
                const roleId = role.id || role._id;
                const perms = await getRolePermissions(roleId);
                const permIds = perms.map((p: any) => p.id || p._id);
                setSelectedPermissions(permIds);
                setInitialPermissions(permIds);
            } catch (e) {
                console.error("Failed to fetch permissions for role", e);
                toast.error("Could not load role permissions");
                setSelectedPermissions([]);
                setInitialPermissions([]);
            }
        } else {
            setEditRole(null);
            setFormData({ name: '', description: '' });
            setSelectedPermissions([]);
            setInitialPermissions([]);
        }
        openModal();
    };

    // ... (rest of the file)


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let savedRole;
            let roleId;
            if (editRole) {
                // Update Role
                savedRole = await updateRole(editRole.id, formData);
                roleId = savedRole.id;
            } else {
                // Create Role
                savedRole = await createRole(formData);
                roleId = savedRole.id || savedRole._id;
            }

            // Handle Permissions Assignment
            // Find added permissions
            const added = selectedPermissions.filter(id => !initialPermissions.includes(id));
            // Find removed permissions
            const removed = initialPermissions.filter(id => !selectedPermissions.includes(id));

            // Execute assignments (sequentially or parallel)
            const promises = [
                ...added.map(permId => assignPermissionToRole(roleId, permId)),
                ...removed.map(permId => removePermissionFromRole(roleId, permId))
            ];

            await Promise.all(promises);

            closeModal();
            toast.success(editRole ? 'Role updated successfully' : 'Role created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save role", error);
            toast.error("Failed to save role");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this role?")) {
            try {
                await deleteRole(id);
                toast.success('Role deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete role", error);
                toast.error("Failed to delete role");
            }
        }
    };

    const togglePermission = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    const handleViewRole = async (role: Role) => {
        setViewRole(role);
        setIsViewModalOpen(true);
        try {
            const perms = await getRolePermissions(role.id || (role as any)._id);
            setViewPermissions(perms);
        } catch (error) {
            console.error("Failed to fetch permissions for role", error);
            setViewPermissions([]);
        }
    };

    const closeViewModal = () => {
        setViewRole(null);
        setViewPermissions([]);
        setIsViewModalOpen(false);
    };

    return (
        <>
            <PageMeta
                title="Role Management | IDRMIS"
                description="Manage system roles and permissions"
            />
            <PageBreadcrumb pageTitle="Roles" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        All Roles
                    </h3>
                    <Button size="sm" onClick={() => handleOpenModal()}>
                        + Add Role
                    </Button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                    Role Name
                                </th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                    Description
                                </th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role: any) => (
                                <tr key={role.id || role._id}>
                                    <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{role.name}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{role.description}</p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleViewRole(role)} title="View Role">
                                                <svg
                                                    className="fill-current"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M8.99981 14.8219C5.84981 14.8219 2.94981 12.9094 1.94981 9.87188C1.86543 9.61875 1.86543 9.36563 1.94981 9.1125C2.94981 6.075 5.84981 4.1625 8.99981 4.1625C12.1498 4.1625 15.0498 6.075 16.0498 9.1125C16.1342 9.36563 16.1342 9.61875 16.0498 9.87188C15.0498 12.9094 12.1498 14.8219 8.99981 14.8219ZM8.99981 5.2875C6.32794 5.2875 3.88106 6.91875 3.03731 9.47813C3.88106 12.0375 6.32794 13.6688 8.99981 13.6688C11.6717 13.6688 14.1186 12.0375 14.9623 9.47813C14.1186 6.91875 11.6717 5.2875 8.99981 5.2875Z"
                                                        fill=""
                                                    />
                                                    <path
                                                        d="M9 12.0375C7.59375 12.0375 6.44062 10.8844 6.44062 9.47813C6.44062 8.07188 7.59375 6.91875 9 6.91875C10.4062 6.91875 11.5594 8.07188 11.5594 9.47813C11.5594 10.8844 10.4062 12.0375 9 12.0375ZM9 8.04375C8.2125 8.04375 7.56562 8.69062 7.56562 9.47813C7.56562 10.2656 8.2125 10.9125 9 10.9125C9.7875 10.9125 10.4344 10.2656 10.4344 9.47813C10.4344 8.69062 9.7875 8.04375 9 8.04375Z"
                                                        fill=""
                                                    />
                                                </svg>
                                            </button>
                                            <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleOpenModal(role)} title="Edit Role">
                                                <svg
                                                    className="fill-current"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M13.7531 2.475C13.2469 1.96875 12.4312 1.96875 11.925 2.475L10.3781 4.02188L13.9781 7.62188L15.525 6.075C16.0312 5.56875 16.0312 4.75313 15.525 4.24688L13.7531 2.475ZM9.225 5.175L2.69999 11.7C2.53124 11.8688 2.44687 12.0938 2.44687 12.3188V15.525C2.44687 15.6938 2.58749 15.8344 2.75624 15.8344H5.96249C6.18749 15.8344 6.41249 15.75 6.58124 15.5813L13.1062 9.05625L9.225 5.175Z"
                                                        fill=""
                                                    />
                                                </svg>
                                            </button>
                                            <button className="hover:text-red-500 text-gray-600 dark:text-gray-300" onClick={() => handleDelete(role.id || role._id)} title="Delete Role">
                                                <svg
                                                    className="fill-current"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M13.7531 2.47502H11.3062V1.9969C11.3062 1.15315 10.6312 0.478149 9.78749 0.478149H8.21249C7.36874 0.478149 6.69374 1.15315 6.69374 1.9969V2.47502H4.24687C3.74062 2.47502 3.37499 2.8969 3.37499 3.40315V3.9094C3.37499 4.07815 3.51561 4.21877 3.68436 4.21877H14.3156C14.4844 4.21877 14.625 4.07815 14.625 3.9094V3.40315C14.625 2.8969 14.2594 2.47502 13.7531 2.47502ZM7.67811 1.9969C7.67811 1.68752 7.93124 1.4344 8.21249 1.4344H9.78749C10.0687 1.4344 10.3219 1.68752 10.3219 1.9969V2.47502H7.70624V1.9969H7.67811Z"
                                                        fill=""
                                                    />
                                                    <path
                                                        d="M14.2312 5.20313H3.76874C3.59999 5.20313 3.45936 5.34375 3.48749 5.5125L4.41561 16.4812C4.47186 17.2406 5.11874 17.8031 5.87811 17.8031H12.1219C12.8812 17.8031 13.5281 17.2406 13.5844 16.4812L14.5125 5.5125C14.5406 5.34375 14.4 5.20313 14.2312 5.20313ZM8.21249 14.9906H7.22811C6.94686 14.9906 6.72186 14.7656 6.72186 14.4844V8.52188C6.72186 8.24063 6.94686 8.01563 7.22811 8.01563H8.21249C8.49374 8.01563 8.71874 8.24063 8.71874 8.52188V14.4844C8.71874 14.7656 8.49374 14.9906 8.21249 14.9906ZM11.2781 14.4844C11.2781 14.7656 11.0531 14.9906 10.7719 14.9906H9.78749C9.50624 14.9906 9.28124 14.7656 9.28124 14.4844V8.52188C9.28124 8.24063 9.50624 8.01563 9.78749 8.01563H10.7719C11.0531 8.01563 11.2781 8.24063 11.2781 8.52188V14.4844Z"
                                                        fill=""
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {editRole ? 'Edit Role' : 'Add New Role'}
                        </h4>
                    </div>
                    <form onSubmit={handleSave} className="flex flex-col">
                        <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-5">
                                <div>
                                    <Label>Role Name</Label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Permissions Selection */}
                                <div>
                                    <Label>Permissions</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                        {permissions.map(perm => (
                                            <label key={perm.id || (perm as any)._id} className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(perm.id || (perm as any)._id)}
                                                    onChange={() => togglePermission(perm.id || (perm as any)._id)}
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="text-sm">
                                                    <span className="font-medium text-gray-900 dark:text-white block">{perm.name}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs">{perm.resource} : {perm.action}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal} type="button">
                                Cancel
                            </Button>
                            <Button size="sm" type="submit">
                                Save
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* View Role Modal */}
            <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            View Role Details
                        </h4>
                    </div>
                    <div className="flex flex-col space-y-5">

                        <div>
                            <Label>Role Name</Label>
                            <div className="p-3 border rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark text-black dark:text-white">
                                {viewRole?.name}
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <div className="p-3 border rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark text-black dark:text-white">
                                {viewRole?.description || "No description provided"}
                            </div>
                        </div>

                        {/* Permissions Display */}
                        <div>
                            <Label>Assigned Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {viewPermissions.length > 0 ? (
                                    viewPermissions.map(perm => (
                                        <div key={perm.id || (perm as any)._id} className="p-3 border rounded bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
                                            <span className="font-medium text-blue-800 dark:text-blue-200 block">{perm.name}</span>
                                            <span className="text-blue-600 dark:text-blue-300 text-xs">{perm.resource} : {perm.action}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-gray-500 py-4">
                                        No permissions assigned to this role.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" onClick={closeViewModal}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
