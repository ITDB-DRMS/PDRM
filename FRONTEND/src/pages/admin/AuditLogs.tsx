import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';

interface AuditLog {
    _id: string;
    userId: {
        _id: string;
        fullname: string;
        email: string;
    } | null;
    action: string;
    resource: string;
    before?: any;
    after?: any;
    timestamp: string;
    ip: string;
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/audit-logs');
                setLogs(response.data);
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    // Filter logs based on search term
    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;

        return logs.filter(log => {
            const searchLower = searchTerm.toLowerCase();

            // Search in timestamp
            if (new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchLower)) {
                return true;
            }

            // Search in user info
            if (log.userId) {
                if (log.userId.fullname.toLowerCase().includes(searchLower) ||
                    log.userId.email.toLowerCase().includes(searchLower)) {
                    return true;
                }
            }

            // Search in action
            if (log.action.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Search in resource
            if (log.resource.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Search in IP address
            if (log.ip.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Search in before/after data
            if (log.before && JSON.stringify(log.before).toLowerCase().includes(searchLower)) {
                return true;
            }
            if (log.after && JSON.stringify(log.after).toLowerCase().includes(searchLower)) {
                return true;
            }

            return false;
        });
    }, [logs, searchTerm]);

    // Pagination logic
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredLogs.length / (itemsPerPage as number));
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * (itemsPerPage as number);
    const endIndex = itemsPerPage === 'all' ? filteredLogs.length : startIndex + (itemsPerPage as number);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    // Reset to first page when search or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    // Helper function to get changed fields between before and after
    const getChangedFields = (before: any, after: any): Set<string> => {
        const changedFields = new Set<string>();

        if (!before || !after) return changedFields;

        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

        allKeys.forEach(key => {
            const beforeValue = JSON.stringify(before[key]);
            const afterValue = JSON.stringify(after[key]);

            if (beforeValue !== afterValue) {
                changedFields.add(key);
            }
        });

        return changedFields;
    };

    // Render JSON with highlighted changed fields
    const renderHighlightedJSON = (obj: any, changedFields: Set<string>, isAfter: boolean) => {
        if (!obj) return <span className="text-gray-500">null</span>;

        const lines = JSON.stringify(obj, null, 2).split('\n');

        return (
            <div>
                {lines.map((line, index) => {
                    // Check if this line contains a changed field
                    let isChanged = false;
                    changedFields.forEach(field => {
                        if (line.includes(`"${field}":`)) {
                            isChanged = true;
                        }
                    });

                    return (
                        <div
                            key={index}
                            className={isChanged && isAfter ? 'bg-yellow-900 bg-opacity-40' : ''}
                            style={isChanged && isAfter ? {
                                backgroundColor: 'rgba(217, 119, 6, 0.2)',
                                borderLeft: '3px solid #f59e0b',
                                paddingLeft: '4px'
                            } : {}}
                        >
                            {line}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className="p-6">Loading audit logs...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">System Audit Logs</h1>

            {/* Search and Items Per Page Controls */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    {/* Search Input */}
                    <div className="flex-1 max-w-md">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search Audit Logs
                        </label>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by user, action, resource, IP, or data..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Items Per Page Selector */}
                    <div className="min-w-[150px]">
                        <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                            Show entries
                        </label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => {
                                const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                                setItemsPerPage(value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedLogs.map((log, index) => {
                            const changedFields = getChangedFields(log.before, log.after);
                            const rowNumber = startIndex + index + 1;

                            return (
                                <React.Fragment key={log._id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {rowNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {log.userId ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.userId.fullname}</span>
                                                    <span className="text-gray-500 text-xs">{log.userId.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">System / Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {log.resource}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => toggleExpand(log._id)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium"
                                            >
                                                {expandedLogId === log._id ? 'Hide' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedLogId === log._id && (
                                        <tr>
                                            <td colSpan={7} className="bg-gray-50 px-6 py-4">
                                                <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96">
                                                    <div>
                                                        <h4 className="text-gray-400 mb-2 border-b border-gray-700 pb-1 font-bold">Before</h4>
                                                        <pre className="whitespace-pre-wrap break-words">
                                                            {renderHighlightedJSON(log.before, changedFields, false)}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-amber-400 mb-2 border-b border-gray-700 pb-1 font-bold flex items-center gap-2">
                                                            After
                                                            {changedFields.size > 0 && (
                                                                <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">
                                                                    {changedFields.size} change{changedFields.size > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <pre className="whitespace-pre-wrap break-words">
                                                            {renderHighlightedJSON(log.after, changedFields, true)}
                                                        </pre>
                                                    </div>
                                                </div>
                                                {changedFields.size > 0 && (
                                                    <div className="mt-3 text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded p-2">
                                                        <span className="font-semibold">Changed fields:</span> {Array.from(changedFields).join(', ')}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {paginatedLogs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    {searchTerm ? 'No audit logs found matching your search.' : 'No audit logs found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls Below Table */}
            {totalPages > 1 && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Pagination Info */}
                        <div className="text-sm text-gray-600">
                            Showing {filteredLogs.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>

                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
