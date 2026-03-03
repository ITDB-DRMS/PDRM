import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import {
    Search, Filter, Plus, MoreVertical,
    FileText, BarChart3, Clock,
    Edit3, Trash2, History, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const TemplateLibrary: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates');
            setTemplates(response.data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (templateId: string, name: string) => {
        try {
            toast.info(`Generating export for ${name}...`);
            const response = await api.get(`/responses/export/${templateId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${name.replace(/\s+/g, '_')}_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to export responses');
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Template Library</h1>
                    <p className="text-gray-500 mt-1">Manage and version your national survey instruments</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                    <Plus size={20} /> Create New Template
                </button>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-hidden">
                    {['All', 'Draft', 'Published', 'Archived'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${filterStatus === status ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all w-72"
                        />
                    </div>
                    <button className="p-2.5 bg-white border rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <motion.div
                            layout
                            key={template._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${template.status === 'Published' ? 'bg-green-100 text-green-700' :
                                        template.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {template.status}
                                    </div>
                                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                                        <MoreVertical size={20} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{template.name}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">{template.description || 'No description provided.'}</p>

                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <BarChart3 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Submissions</p>
                                            <p className="text-sm font-bold text-gray-700">{template.usageCount}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <History size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Version</p>
                                            <p className="text-sm font-bold text-gray-700">v{template.version}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <Clock size={14} /> Updated {new Date(template.updatedAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport(template._id, template.name)}
                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-green-600 transition-all border border-transparent hover:border-green-100"
                                        title="Export CSV"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                                        <Edit3 size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {filteredTemplates.length === 0 && !loading && (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <FileText size={64} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No templates found</h3>
                    <p className="text-gray-400 mt-1">Try changing your filters or create a new one</p>
                </div>
            )}
        </div>
    );
};

export default TemplateLibrary;
