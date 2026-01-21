import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import {
    Organization,
    getOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from '../../api/organizationService';
import { OrganizationForm } from './OrganizationForm';
import { PencilIcon, TrashBinIcon, AngleLeftIcon, AngleRightIcon } from '../../icons';

export default function OrganizationList() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    // Filter organizations based on search term
    const filteredOrganizations = organizations.filter(org => {
        const term = searchTerm.toLowerCase();
        return (
            org.name.toLowerCase().includes(term) ||
            org.type.toLowerCase().includes(term) ||
            (typeof org.parentId === 'object' && org.parentId && (org.parentId as any).name.toLowerCase().includes(term))
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrganizations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (org?: Organization, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        setEditOrg(org || null);
        openModal();
    };

    const handleSave = async (data: any) => {
        try {
            if (editOrg) {
                await updateOrganization(editOrg.id, data);
            } else {
                await createOrganization(data);
            }
            closeModal();
            toast.success(editOrg ? 'Organization updated successfully' : 'Organization created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save organization", error);
            toast.error("Failed to save organization");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this organization?")) {
            try {
                await deleteOrganization(id);
                toast.success('Organization deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete organization", error);
                toast.error("Failed to delete organization. Ensure it has no dependencies.");
            }
        }
    };

    return (
        <>
            <PageMeta
                title="Organization Management | IDRMIS"
                description="Manage organizations structure"
            />
            <PageBreadcrumb pageTitle="Organizations" />

            <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
                <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
                    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                            Organizations
                        </h3>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <svg
                                        className="fill-gray-500 hover:fill-primary dark:fill-gray-400"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M9.16666 3.33332C5.945 3.33332 3.33333 5.945 3.33333 9.16666C3.33333 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66667 9.16666C1.66667 5.02452 5.02452 1.66665 9.16666 1.66665C13.3088 1.66665 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66667 13.3088 1.66667 9.16666Z"
                                        />
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                                        />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search organizations..."
                                    className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={() => handleOpenModal()}>
                                + Add Organization
                            </Button>
                        </div>
                    </div>

                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Parent</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-gray-500">Loading...</td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-gray-500">No organizations found</td>
                                    </tr>
                                ) : (
                                    currentItems.map((org) => (
                                        <tr key={org.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
                                            <td className="px-4 py-3">
                                                <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">{org.name}</h5>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-white/90 capitalize">
                                                    {org.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {typeof org.parentId === 'object' && org.parentId ? (org.parentId as any).name : '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                                        onClick={() => handleOpenModal(org, 'view')}
                                                        title="View"
                                                    >
                                                        <svg className="fill-current w-4 h-4" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M9 13.5C6.075 13.5 3.51563 11.6437 2.475 9C3.51563 6.35625 6.075 4.5 9 4.5C11.925 4.5 14.4844 6.35625 15.525 9C14.4844 11.6437 11.925 13.5 9 13.5ZM9 5.625C7.14375 5.625 5.625 7.14375 5.625 9C5.625 10.8562 7.14375 12.375 9 12.375C10.8562 12.375 12.375 10.8562 12.375 9C12.375 7.14375 10.8562 5.625 9 5.625ZM9 10.5C8.15625 10.5 7.5 9.84375 7.5 9C7.5 8.15625 8.15625 7.5 9 7.5C9.84375 7.5 10.5 8.15625 10.5 9C10.5 9.84375 9.84375 10.5 9 10.5Z" fill="" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                                        onClick={() => handleOpenModal(org, 'edit')}
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-500"
                                                        onClick={() => handleDelete(org.id)}
                                                        title="Delete"
                                                    >
                                                        <TrashBinIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrganizations.length)} of {filteredOrganizations.length} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className={`flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <AngleLeftIcon className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button
                                        key={number}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium ${currentPage === number
                                            ? 'border-brand-500 bg-brand-500 text-white'
                                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => setCurrentPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    className={`flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    <AngleRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Organization' : editOrg ? 'Edit Organization' : 'Add New Organization'}
                        </h4>
                    </div>

                    <OrganizationForm
                        initialData={editOrg}
                        isViewMode={isViewMode}
                        onSave={handleSave}
                        onCancel={closeModal}
                    />
                </div>
            </Modal>
        </>
    );
}
