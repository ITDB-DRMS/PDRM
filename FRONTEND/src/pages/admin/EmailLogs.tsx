import { useState, useEffect } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getEmailLogs, resendEmail, EmailLog } from '../../api/emailLogService';
import Button from "../../components/ui/button/Button";
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';

export default function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchLogs();
    }, [refresh]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getEmailLogs();
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch email logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (id: string) => {
        try {
            await resendEmail(id);
            alert("Email requeued for sending");
            setRefresh(prev => prev + 1); // Refresh list
        } catch (error) {
            console.error("Failed to resend email", error);
            alert("Failed to resend email");
        }
    };

    const handleView = (log: EmailLog) => {
        setSelectedLog(log);
        openModal();
    };

    return (
        <>
            <PageMeta
                title="Email Logs | IDRMIS"
                description="View email sending status and logs"
            />
            <PageBreadcrumb pageTitle="Email Logs" />

            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                        Email Logs
                    </h3>
                    <Button size="sm" onClick={() => setRefresh(prev => prev + 1)}>
                        Refresh
                    </Button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Time</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Recipient</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Error</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500">Loading...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500">No logs found</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                                            {log.recipient}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 capitalize">
                                                {log.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${log.status === 'sent'
                                                ? 'bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400'
                                                : log.status === 'failed'
                                                    ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                                                    : 'bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-400'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-red-500 dark:text-red-400 max-w-xs truncate" title={log.error}>
                                            {log.error || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleView(log)}
                                                    className="hover:text-primary text-gray-600 dark:text-gray-300"
                                                    title="View Details"
                                                >
                                                    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 13.5C6.075 13.5 3.51563 11.6437 2.475 9C3.51563 6.35625 6.075 4.5 9 4.5C11.925 4.5 14.4844 6.35625 15.525 9C14.4844 11.6437 11.925 13.5 9 13.5ZM9 5.625C7.14375 5.625 5.625 7.14375 5.625 9C5.625 10.8562 7.14375 12.375 9 12.375C10.8562 12.375 12.375 10.8562 12.375 9C12.375 7.14375 10.8562 5.625 9 5.625ZM9 10.5C8.15625 10.5 7.5 9.84375 7.5 9C7.5 8.15625 8.15625 7.5 9 7.5C9.84375 7.5 10.5 8.15625 10.5 9C10.5 9.84375 9.84375 10.5 9 10.5Z" fill="" />
                                                    </svg>
                                                </button>
                                                {log.status === 'failed' && (
                                                    <button
                                                        onClick={() => handleResend(log._id)}
                                                        className="text-sm font-medium text-brand-500 hover:underline"
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Email Log Details
                        </h4>
                    </div>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Recipient</label>
                                    <p className="text-gray-800 dark:text-white">{selectedLog.recipient}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                                    <p className="text-gray-800 dark:text-white capitalize">{selectedLog.type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                    <p className="text-gray-800 dark:text-white capitalize">{selectedLog.status}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Sent At</label>
                                    <p className="text-gray-800 dark:text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedLog.error && (
                                <div>
                                    <label className="block text-sm font-medium text-red-500 dark:text-red-400">Error</label>
                                    <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 font-mono break-all">
                                        {selectedLog.error}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button size="sm" variant="outline" onClick={closeModal}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
