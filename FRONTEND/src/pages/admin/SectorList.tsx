import React, { useState, useEffect } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import api from '../../api/axios';

interface Organization {
    id: string;
    name: string;
    type: string;
}

interface Sector {
    id: string;
    name: string;
    organizationId: string;
    organization?: Organization;
    description?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function SectorList() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [editSector, setEditSector] = useState<Sector | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        organizationId: '',
        description: '',
        status: 'active'
    });

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchSectors();
        fetchOrganizations();
    }, []);

    const fetchSectors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sectors');
            setSectors(response.data);
        } catch (error) {
            console.error('Failed to fetch sectors', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await api.get('/organizations');
            const headOffices = response.data.filter((org: Organization) => org.type === 'head_office');
            setOrganizations(headOffices);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        }
    };

    const handleOpenModal = (sector?: Sector, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        if (sector) {
            setEditSector(sector);
            setFormData({
                name: sector.name,
                organizationId: sector.organizationId,
                description: sector.description || '',
                status: sector.status
            });
        } else {
            setEditSector(null);
            setFormData({
                name: '',
                organizationId: '',
                description: '',
                status: 'active'
            });
        }
        openModal();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Saving sector with data:', formData);

        try {
            if (editSector) {
                console.log('Updating sector:', editSector.id);
                await api.put(`/sectors/${editSector.id}`, formData);
            } else {
                console.log('Creating new sector');
                await api.post('/sectors', formData);
            }
            closeModal();
            fetchSectors();
        } catch (error: any) {
            console.error('Failed to save sector:', error);
            console.error('Error response:', error.response);

            const errorMessage = error.response?.data?.message || 'Failed to save sector';
            const errors = error.response?.data?.errors;

            if (errors && Array.isArray(errors)) {
                alert(`${errorMessage}\n\n${errors.join('\n')}`);
            } else {
                alert(errorMessage);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this sector?')) {
            try {
                await api.delete(`/sectors/${id}`);
                fetchSectors();
            } catch (error: any) {
                console.error('Failed to delete sector', error);
                const errorMessage = error.response?.data?.message || 'Failed to delete sector';
                alert(errorMessage);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <>
            <PageMeta
                title="Sector Management | IDRMIS"
                description="Manage sectors"
            />
            <PageBreadcrumb pageTitle="Sectors" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Sectors
                    </h3>
                    <Button size="sm" onClick={() => handleOpenModal()}>
                        + Add Sector
                    </Button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                    Name
                                </th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                    Organization
                                </th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                                    Description
                                </th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                    Status
                                </th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4">Loading...</td>
                                </tr>
                            ) : sectors.map((sector) => (
                                <tr key={sector.id}>
                                    <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{sector.name}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {sector.organization?.name || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {sector.description || '-'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <span className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${sector.status === 'active'
                                            ? 'bg-success text-success'
                                            : 'bg-danger text-danger'
                                            }`}>
                                            {sector.status}
                                        </span>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleOpenModal(sector, 'view')} title="View">
                                                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 13.5C6.075 13.5 3.51563 11.6437 2.475 9C3.51563 6.35625 6.075 4.5 9 4.5C11.925 4.5 14.4844 6.35625 15.525 9C14.4844 11.6437 11.925 13.5 9 13.5ZM9 5.625C7.14375 5.625 5.625 7.14375 5.625 9C5.625 10.8562 7.14375 12.375 9 12.375C10.8562 12.375 12.375 10.8562 12.375 9C12.375 7.14375 10.8562 5.625 9 5.625ZM9 10.5C8.15625 10.5 7.5 9.84375 7.5 9C7.5 8.15625 8.15625 7.5 9 7.5C9.84375 7.5 10.5 8.15625 10.5 9C10.5 9.84375 9.84375 10.5 9 10.5Z" fill="" />
                                                </svg>
                                            </button>
                                            <button className="hover:text-primary text-gray-600 dark:text-gray-300" onClick={() => handleOpenModal(sector, 'edit')} title="Edit">
                                                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M13.7531 2.475C13.2469 1.96875 12.4312 1.96875 11.925 2.475L10.3781 4.02188L13.9781 7.62188L15.525 6.075C16.0312 5.56875 16.0312 4.75313 15.525 4.24688L13.7531 2.475ZM9.225 5.175L2.69999 11.7C2.53124 11.8688 2.44687 12.0938 2.44687 12.3188V15.525C2.44687 15.6938 2.58749 15.8344 2.75624 15.8344H5.96249C6.18749 15.8344 6.41249 15.75 6.58124 15.5813L13.1062 9.05625L9.225 5.175Z" fill="" />
                                                </svg>
                                            </button>
                                            <button className="hover:text-red-500 text-gray-600 dark:text-gray-300" onClick={() => handleDelete(sector.id)} title="Delete">
                                                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M13.7531 2.47502H11.3062V1.9969C11.3062 1.15315 10.6312 0.478149 9.78749 0.478149H8.21249C7.36874 0.478149 6.69374 1.15315 6.69374 1.9969V2.47502H4.24687C3.74062 2.47502 3.37499 2.8969 3.37499 3.40315V3.9094C3.37499 4.07815 3.51561 4.21877 3.68436 4.21877H14.3156C14.4844 4.21877 14.625 4.07815 14.625 3.9094V3.40315C14.625 2.8969 14.2594 2.47502 13.7531 2.47502ZM7.67811 1.9969C7.67811 1.68752 7.93124 1.4344 8.21249 1.4344H9.78749C10.0687 1.4344 10.3219 1.68752 10.3219 1.9969V2.47502H7.70624V1.9969H7.67811Z" fill="" />
                                                    <path d="M14.2312 5.20313H3.76874C3.59999 5.20313 3.45936 5.34375 3.48749 5.5125L4.41561 16.4812C4.47186 17.2406 5.11874 17.8031 5.87811 17.8031H12.1219C12.8812 17.8031 13.5281 17.2406 13.5844 16.4812L14.5125 5.5125C14.5406 5.34375 14.4 5.20313 14.2312 5.20313ZM8.21249 14.9906H7.22811C6.94686 14.9906 6.72186 14.7656 6.72186 14.4844V8.52188C6.72186 8.24063 6.94686 8.01563 7.22811 8.01563H8.21249C8.49374 8.01563 8.71874 8.24063 8.71874 8.52188V14.4844C8.71874 14.7656 8.49374 14.9906 8.21249 14.9906ZM11.2781 14.4844C11.2781 14.7656 11.0531 14.9906 10.7719 14.9906H9.78749C9.50624 14.9906 9.28124 14.7656 9.28124 14.4844V8.52188C9.28124 8.24063 9.50624 8.01563 9.78749 8.01563H10.7719C11.0531 8.01563 11.2781 8.24063 11.2781 8.52188V14.4844Z" fill="" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && sectors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500">
                                        No sectors found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Sector' : editSector ? 'Edit Sector' : 'Add New Sector'}
                        </h4>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div>
                            <Label>Sector Name *</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={isViewMode}
                            />
                        </div>

                        <div>
                            <Label>Organization (Head Office Only) *</Label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                required
                                disabled={isViewMode}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                            >
                                <option value="">Select Organization</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            {organizations.length === 0 && (
                                <p className="text-sm text-red-500 mt-1">No head office organizations found</p>
                            )}
                        </div>

                        <div>
                            <Label>Description</Label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                disabled={isViewMode}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        <div>
                            <Label>Status</Label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {!isViewMode && (
                            <div className="flex items-center gap-3 mt-4 justify-end">
                                <Button size="sm" variant="outline" onClick={closeModal} type="button">
                                    Cancel
                                </Button>
                                <Button size="sm" type="submit">
                                    {editSector ? 'Update' : 'Save'}
                                </Button>
                            </div>
                        )}
                        {isViewMode && (
                            <div className="flex items-center gap-3 mt-4 justify-end">
                                <Button size="sm" variant="outline" onClick={closeModal} type="button">
                                    Close
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </Modal>
        </>
    );
}
