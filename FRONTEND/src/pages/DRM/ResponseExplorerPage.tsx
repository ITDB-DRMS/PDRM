import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '@/api/axios';
import {
    ArrowLeft, Search, Download,
    User, Clock, ChevronRight,
    Database, Calendar, X,
    FileText, CheckCircle2,
    Eye, Edit3, RefreshCw, Copy
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
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 hover:shadow-lg transition-all">
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
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
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

    const handleSync = (resId: string) => {
        navigator.clipboard.writeText(resId).then(() => {
            toast.success("Response ID copied! Switching to Woreda Profile...");
            setTimeout(() => {
                navigate(`/woreda-profile?syncResponseId=${resId}`);
            }, 1200);
        });
    };

    const filteredResponses = responses.filter(r => {
        const searchText = search.toLowerCase();
        const matchesBasic = (
            r.respondentMetadata?.fullName?.toLowerCase().includes(searchText) ||
            r._id.toLowerCase().includes(searchText)
        );
        
        // Search in answers for keys containing 'house'
        const matchesHouse = Object.entries(r.answers || {}).some(([k, v]: [string, any]) => {
            if (!k.toLowerCase().includes('house')) return false;
            const val = (v?.value ?? v)?.toString() || '';
            return val.toLowerCase().includes(searchText);
        });

        return matchesBasic || matchesHouse;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium font-sans animate-pulse">Synchronizing database...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
            <PageMeta title={`Database | ${template?.name}`} description="Response management" />

            {/* Gradient Header Decorator */}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none z-0" />

            {/* Top Navigation & Title */}
            <header className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-xl shadow-sm transition-all flex items-center justify-center border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100/50 backdrop-blur-sm px-3 py-1 rounded-lg">Response Explorer</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Version {template?.version}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{template?.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 transition-all"
                    >
                        <Download size={18} /> Export Results XLS
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-[1400px] mx-auto px-6 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <Database size={24} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-2">{responses.length}</h2>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Logs Captured</p>
                        </div>
                    </motion.div>
                </div>

                {/* Data List Container */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
                    {/* Search & Tool Bar */}
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative w-full md:w-[480px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by ID, Enumerator or House Number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                            Matching {filteredResponses.length} Entries
                        </div>
                    </div>

                    {/* Clean Table / List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 backdrop-blur-sm">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Record Track ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">House No</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Captured By</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                                    <th className="px-8 py-5 text-right w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 relative">
                                {filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-slate-400 font-bold">No tracking records found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResponses.map((res: any) => (
                                        <tr
                                            key={res._id}
                                            className="group hover:bg-slate-50/50 transition-all"
                                        >
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50/50 text-indigo-600 rounded-2xl flex items-center justify-center font-mono text-[10px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        #{res._id.slice(-4).toUpperCase()}
                                                    </div>
                                                    <span className="text-[12px] font-mono text-slate-500 font-semibold cursor-pointer group-hover:text-indigo-600 transition-colors" title="Copy Full ID" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(res._id); toast.success('ID Copied!'); }}>{res._id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">
                                                        {(() => {
                                                            const houseEntry = Object.entries(res.answers || {}).find(([k]) => k.toLowerCase().includes('house'));
                                                            const val = houseEntry?.[1] as any;
                                                            return val?.value ?? val ?? 'N/A';
                                                        })()}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Premise ID</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{res.respondentMetadata?.fullName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Field User</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                                        {new Date(res.submittedAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                                                        <Clock size={12} />
                                                        {new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[10px] font-bold tracking-widest uppercase ${res.isDraft ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${res.isDraft ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                    {res.isDraft ? 'Draft Mode' : 'Verified'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right relative z-10">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => handleSync(res._id)}
                                                        title={
                                                            res.syncStatus === 'SYNCED' ? 'Already Synced' : 
                                                            res.syncStatus === 'UPDATED' ? 'Update Required (Data Changed)' : 
                                                            'Sync to Profile'
                                                        }
                                                        className={`w-10 h-10 rounded-2xl border transition-all shadow-sm group/btn flex items-center justify-center ${
                                                            res.syncStatus === 'SYNCED' 
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                            res.syncStatus === 'UPDATED'
                                                                ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                            'bg-amber-50 border-amber-200 text-amber-600 animate-pulse-subtle'
                                                        } hover:scale-110`}
                                                    >
                                                        <RefreshCw size={16} className={`${res.syncStatus === 'UNSYNCED' ? 'animate-spin-slow' : ''} group-hover/btn:rotate-180 transition-transform duration-500`} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/responses/${templateId}?edit=${res._id}`)}
                                                        title="Edit Survey"
                                                        className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 text-slate-400 flex items-center justify-center transition-all shadow-sm"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedResponse(res)}
                                                        title="View Record"
                                                        className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shadow-slate-200"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
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
