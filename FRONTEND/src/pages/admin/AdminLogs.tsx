import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Search, Shield, User, Activity, Clock, Server, AlertTriangle, Info, Database, Trash2, Edit2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLog {
    _id: string;
    userId: {
        _id: string;
        fullname: string;
        username: string;
        email: string;
    } | null;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    timestamp: string;
    ip?: string;
    severity: 'info' | 'warning' | 'critical';
}

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, critical: 0, admins: 0 });

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/admin-logs');
                const data = response.data || [];
                setLogs(data);
                
                setStats({
                    total: data.length,
                    critical: data.filter((l: AdminLog) => l.severity !== 'info').length,
                    admins: new Set(data.map((l: AdminLog) => l.userId?._id)).size
                });
            } catch (err: any) {
                console.error('Failed to fetch admin logs', err);
                setError(err.response?.data?.message || 'Access denied or server error connection issue.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.resource || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.userId?.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.ip || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
            return matchesSearch && matchesSeverity;
        });
    }, [logs, searchTerm, severityFilter]);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATE')) return <Plus className="text-emerald-500" size={14} />;
        if (action.includes('UPDATE')) return <Edit2 className="text-blue-500" size={14} />;
        if (action.includes('DELETE')) return <Trash2 className="text-rose-500" size={14} />;
        return <Activity className="text-slate-400" size={14} />;
    };

    return (
        <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-10">
            <PageMeta title="Admin Logs | IDRMIS" description="System administrative activity history" />
            <PageBreadcrumb pageTitle="Admin Logs" />

            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Dashboard Stats Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                        <Shield className="absolute right-[-10%] bottom-[-10%] text-white/10 w-24 h-24 sm:w-40 sm:h-40 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative">
                            <h3 className="text-white/70 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-1">Total Admin Actions</h3>
                            <div className="text-2xl sm:text-5xl font-black text-white leading-tight">{stats.total}</div>
                            <div className="mt-4 flex items-center gap-2 text-indigo-200 text-[9px] sm:text-xs font-semibold">
                                <Clock size={14} /> Last 90 days activity
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/80 p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden group backdrop-blur-xl">
                        <AlertTriangle className="absolute right-[-10%] bottom-[-10%] text-amber-500/10 w-24 h-24 sm:w-40 sm:h-40 group-hover:rotate-12 transition-transform duration-500" />
                        <div className="relative">
                            <h3 className="text-slate-400 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-1">Critical Warnings</h3>
                            <div className="text-2xl sm:text-5xl font-black text-amber-500 leading-tight">{stats.critical}</div>
                            <div className="mt-4 flex items-center gap-2 text-slate-500 text-[9px] sm:text-xs font-semibold">
                                <Info size={14} /> Review recommended
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                        <div className="relative">
                            <h3 className="text-white/40 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-1">Active Administrators</h3>
                            <div className="text-2xl sm:text-5xl font-black text-white leading-tight">{stats.admins}</div>
                            <div className="mt-4 flex items-center gap-2 text-white/20 text-[9px] sm:text-xs font-semibold">
                                <User size={14} /> Total unique sessions
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Global Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl p-4 sm:p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-2xl">
                    <div className="relative flex-1 max-w-lg w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Lookup actions, users, resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 sm:h-14 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 pl-14 pr-4 font-medium text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all shadow-sm text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="h-12 sm:h-14 flex-1 lg:flex-none px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-white/60 outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="all">Priority: All</option>
                            <option value="info">Priority: Low</option>
                            <option value="warning">Priority: High</option>
                            <option value="critical">Priority: Urgent</option>
                        </select>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-[2.5rem] border border-white/10 bg-white/30 dark:bg-slate-900/30 overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto min-w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Action Context</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Authority User</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">System Resource</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Priority</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Endpoint Meta</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 text-right">Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-40 text-center animate-pulse">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Activity Data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center text-rose-500 bg-rose-500/5">
                                                <div className="flex flex-col items-center gap-4">
                                                    <AlertTriangle size={32} />
                                                    <span className="font-bold uppercase tracking-[0.2em]">{error}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                        <React.Fragment key={log._id}>
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`group hover:bg-white/60 dark:hover:bg-white/[0.03] transition-colors ${expandedLogId === log._id ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5 focus:outline-none">
                                                        <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-2 group-hover:text-primary transition-colors">
                                                            {getActionIcon(log.action)}
                                                            {log.action}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                                            <Clock size={12} className="opacity-50" />
                                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                                dateStyle: 'medium',
                                                                timeStyle: 'medium'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/40 shadow-inner group-hover:scale-110 transition-transform">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{log.userId?.fullname || 'CORE_SYSTEM'}</span>
                                                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[160px]">{log.userId?.email || 'svc-process@idrmis.local'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 font-mono">
                                                    <div className="space-y-1.5">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-600 dark:text-indigo-400 tracking-wider">
                                                            <Database size={12} />
                                                            {log.resource}
                                                        </span>
                                                        {log.resourceId && <div className="text-[9px] text-slate-400 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">REF: {log.resourceId}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSeverityStyles(log.severity)}`}>
                                                        {log.severity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Server size={12} className="opacity-40 text-primary" />
                                                            {log.ip || 'INTERNAL'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                                                        className={`h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${expandedLogId === log._id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xl scale-95' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950'}`}
                                                    >
                                                        {expandedLogId === log._id ? 'Hide' : 'Inspect'}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                            <AnimatePresence>
                                                {expandedLogId === log._id && (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-0 border-none bg-slate-50/50 dark:bg-black/20">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0, scale: 0.99 }}
                                                                animate={{ height: 'auto', opacity: 1, scale: 1 }}
                                                                exit={{ height: 0, opacity: 0, scale: 0.99 }}
                                                                className="overflow-hidden mb-8"
                                                            >
                                                                <div className="mt-4 p-8 rounded-[2rem] bg-slate-950 text-indigo-100 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] border border-white/5">
                                                                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                                                                <Activity size={18} className="text-indigo-400" />
                                                                            </div>
                                                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Action Payload Object</span>
                                                                        </div>
                                                                        {log.resourceId && (
                                                                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-[10px] font-mono text-indigo-300 border border-white/5">
                                                                                REF: {log.resourceId}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <pre className="text-xs font-mono leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5 overflow-x-auto max-h-[500px] custom-scrollbar selection:bg-indigo-500/30">
                                                                        {JSON.stringify(log.details || {}, null, 4)}
                                                                    </pre>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/10">
                                                        <Database size={32} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-slate-900 dark:text-white font-bold">No Activity Recorded</h3>
                                                        <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                            We couldn't find any administrative logs matching your criteria. Administrative actions are recorded in real-time.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
