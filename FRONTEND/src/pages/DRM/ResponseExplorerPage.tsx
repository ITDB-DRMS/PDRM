import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '@/api/axios';
import {
    ArrowLeft, Search, Download,
    User, Clock, ChevronRight,
    Database, Calendar, X,
    FileText, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';

// --- Sub-component: Detail View Modal ---
const ResponseDetailsModal: React.FC<{
    response: any;
    template: any;
    onClose: () => void
}> = ({ response, template, onClose }) => {
    if (!response || !template) return null;

    const getAnswer = (fieldCode: string) => {
        const answers = response.answers;
        if (!answers) return undefined;
        const val = answers instanceof Map ? answers.get(fieldCode) : answers[fieldCode];
        
        // Handle new structured value { value, answerId }
        if (typeof val === 'object' && val !== null && 'value' in val) {
            return val;
        }
        return { value: val };
    };

    const renderAnswerValue = (field: any) => {
        const { value, answerId } = getAnswer(field.questionCode) || {};
        
        if (value === undefined || value === null || value === '') {
            return <span className="text-gray-300 italic">No response</span>;
        }

        return (
            <div className="space-y-1">
                <div className="text-slate-900 font-medium">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
                {answerId && (
                    <div className="flex items-center gap-1.5 ">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-mono text-slate-300 uppercase">UID: {answerId}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[40px] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Assessment Record</p>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{template.name}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-10">
                    <div className="max-w-4xl mx-auto space-y-12">

                        {/* Profile Summary Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enumerator</p>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <User size={16} className="text-indigo-400" />
                                    <span className="font-semibold">{response.respondentMetadata?.fullName || 'Anonymous'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Time</p>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Calendar size={16} className="text-indigo-400" />
                                    <span className="font-semibold">{new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record Status</p>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className={response.isDraft ? 'text-amber-400' : 'text-emerald-500'} />
                                    <span className={`font-semibold ${response.isDraft ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {response.isDraft ? 'Pending Draft' : 'Verified Final'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Responses by Module */}
                        <div className="space-y-10">
                            {template.modules?.map((module: any, mIdx: number) => (
                                <section key={module.moduleId} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-900 font-bold text-sm">
                                            {mIdx + 1}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{module.title}</h3>
                                        <div className="flex-1 h-px bg-slate-200/50" />
                                    </div>

                                    <div className="space-y-8 pl-14">
                                        {module.sections?.map((section: any) => (
                                            <div key={section.sectionId} className="space-y-4">
                                                <h4 className="text-sm font-bold text-indigo-500">{section.title}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    {section.fields?.map((field: any) => (
                                                        <div key={field.fieldId} className="group border-b border-slate-100 pb-3 transition-colors hover:border-indigo-100">
                                                            <p className="text-[11px] text-slate-400 font-medium mb-1.5 transition-colors group-hover:text-indigo-400">{field.label}</p>
                                                            <div className="min-h-[1.5rem]">
                                                                {renderAnswerValue(field)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-white border-t border-slate-50 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-100"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200"
                    >
                        Export PDF
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Page Component ---
const ResponseExplorerPage: React.FC = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedResponse, setSelectedResponse] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [tmplRes, respRes] = await Promise.all([
                    api.get(`/templates/${templateId}`),
                    api.get(`/responses?templateId=${templateId}`)
                ]);
                setTemplate(tmplRes.data);
                setResponses(respRes.data);
            } catch (error: any) {
                toast.error('Failed to load responses');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (templateId) fetchData();
    }, [templateId]);

    const handleExportCSV = async () => {
        try {
            const response = await api.get(`/responses/export/${templateId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${template?.name?.replace(/\s+/g, '_')}_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const filteredResponses = responses.filter(r =>
        r.respondentMetadata?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r._id.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium font-sans animate-pulse">Synchronizing database...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 px-6 font-sans">
            <PageMeta title={`Database | ${template?.name}`} description="Response management" />

            {/* Top Navigation & Title */}
            <header className="max-w-[1400px] mx-auto pt-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-xl transition-all flex items-center justify-center border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Template Vault</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ver {template?.version}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{template?.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                    >
                        <Download size={18} /> Download Excel
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Collected Data</p>
                            <h2 className="text-4xl font-bold text-slate-900">{responses.length} <span className="text-lg font-medium text-slate-300">submissions</span></h2>
                        </div>
                        <Database size={100} className="absolute -right-6 -bottom-6 text-slate-50 rotate-12" />
                    </div>
                </div>

                {/* Data List Container */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {/* Search & Tool Bar */}
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or reference ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-medium text-slate-600 placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                            Showing {filteredResponses.length} records
                        </div>
                    </div>

                    {/* Clean Table / List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry ID</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enumerator</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-300 italic text-sm">No data logs found.</td>
                                    </tr>
                                ) : (
                                    filteredResponses.map((res: any) => (
                                        <tr
                                            key={res._id}
                                            onClick={() => setSelectedResponse(res)}
                                            className="group hover:bg-indigo-50/30 cursor-pointer transition-all"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-indigo-600 transition-colors rounded-xl flex items-center justify-center text-slate-400 group-hover:text-white font-mono text-[10px] font-bold">
                                                        #{res._id.slice(-4).toUpperCase()}
                                                    </div>
                                                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-indigo-600 transition-colors truncate max-w-[120px]">{res._id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5">{res.respondentMetadata?.fullName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Enumerator</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2 text-slate-900 text-[13px] font-semibold">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        {new Date(res.submittedAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                                                        <Clock size={12} />
                                                        {new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight ${res.isDraft ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full ${res.isDraft ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                    {res.isDraft ? 'Pending Draft' : 'Verified Final'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="w-10 h-10 rounded-full border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 text-slate-300 flex items-center justify-center transition-all ml-auto">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Layer */}
            <AnimatePresence>
                {selectedResponse && (
                    <ResponseDetailsModal
                        response={selectedResponse}
                        template={template}
                        onClose={() => setSelectedResponse(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResponseExplorerPage;
