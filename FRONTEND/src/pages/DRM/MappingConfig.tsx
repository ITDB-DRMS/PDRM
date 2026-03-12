import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit3, Trash2, X, 
    CheckCircle, Database, Layers, ArrowRightLeft,
    Calculator, Hash, RefreshCw, ChevronRight, 
    Settings2, Info, Sparkles, Filter, Search,
    ArrowRight, Binary, Zap, Code, ShieldCheck, Box
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
    getProfileMappings, 
    createProfileMapping, 
    updateProfileMapping, 
    deleteProfileMapping,
    type ProfileMapping,
    type ProfileMappingItem
} from '../../api/profileMappingService';
import api from '../../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────
const WOREDA_PROFILE_FIELDS = [
    { group: 'Location', path: 'location.subcity', label: 'Subcity' },
    { group: 'Location', path: 'location.woreda', label: 'Woreda' },
    { group: 'Location', path: 'location.block', label: 'Block' },
    { group: 'Location', path: 'location.house_no', label: 'House No' },
    
    { group: 'Demographics', path: 'demographics.total_population', label: 'Total Population' },
    { group: 'Demographics', path: 'demographics.male_population', label: 'Male Population' },
    { group: 'Demographics', path: 'demographics.female_population', label: 'Female Population' },
    { group: 'Demographics', path: 'demographics.children_0_17', label: 'Children (0-17)' },
    { group: 'Demographics', path: 'demographics.youth_18_29', label: 'Youth (18-29)' },
    { group: 'Demographics', path: 'demographics.adults_30_59', label: 'Adults (30-59)' },
    { group: 'Demographics', path: 'demographics.elderly_60_plus', label: 'Elderly (60+)' },
    { group: 'Demographics', path: 'demographics.total_households', label: 'Total Households' },
    { group: 'Demographics', path: 'demographics.female_headed_households', label: 'Female-headed HH' },
    { group: 'Demographics', path: 'demographics.informal_settlement_population', label: 'Informal Settlement' },
    { group: 'Demographics', path: 'demographics.low_income_households', label: 'Low Income HH' },
    { group: 'Demographics', path: 'demographics.unemployment_rate', label: 'Unemployment Rate (%)' },
    { group: 'Demographics', path: 'demographics.internally_displaced_population', label: 'IDP Population' },

    { group: 'Services', path: 'basic_services.water_source', label: 'Water Source' },
    { group: 'Services', path: 'basic_services.electricity', label: 'Electricity Access' },
    { group: 'Services', path: 'basic_services.road_access', label: 'Road Access' },
    { group: 'Services', path: 'basic_services.drainage_system_coverage', label: 'Drainage Coverage' },
    { group: 'Services', path: 'basic_services.solid_waste_management_coverage', label: 'Solid Waste Coverage' },
    { group: 'Services', path: 'basic_services.telecommunications_access', label: 'Telecom Access' },

    { group: 'Housing', path: 'housing_indicators.percent_non_durable_materials', label: 'Non-Durable Materials (%)' },
    { group: 'Housing', path: 'housing_indicators.informal_housing_coverage', label: 'Informal Housing (%)' },
    { group: 'Housing', path: 'housing_indicators.compliance_with_building_codes', label: 'Building Code Compliance' },

    { group: 'Risk Index', path: 'risk_index.overall_woreda_risk_score', label: 'Overall Risk Score' },
    { group: 'Risk Index', path: 'risk_index.hazard_index', label: 'Hazard Index' },
    { group: 'Risk Index', path: 'risk_index.vulnerability_index', label: 'Vulnerability Index' },
    { group: 'Risk Index', path: 'risk_index.exposure_index', label: 'Exposure Index' },
    { group: 'Risk Index', path: 'risk_index.capacity_index', label: 'Capacity Index' },
];


// ─── Transformation Types ───────────────────────────────────────────────────
const TRANSFORMATION_TYPES = [
    { value: 'direct', label: 'Direct Entry', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { value: 'cast_number', label: 'Convert to Number', icon: Binary, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'boolean_map', label: 'Logic Map (Yes/No)', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { value: 'lookup', label: 'Lookup Table', icon: Filter, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'calculation', label: 'Calculation Engine', icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-50' },
];

// ─── Helper Components ────────────────────────────────────────────────────────
const MappingRow: React.FC<{ 
    item: ProfileMappingItem; 
    idx: number; 
    templateFields: any[];
    updateRow: (u: Partial<ProfileMappingItem>) => void;
    removeRow: () => void;
}> = ({ item, idx, templateFields, updateRow, removeRow }) => {
    const transformation = TRANSFORMATION_TYPES.find(t => t.value === item.transformation) || TRANSFORMATION_TYPES[0];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-12 gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all items-center relative group"
        >
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-lg border-4 border-white">
                {idx + 1}
            </div>

            <div className="col-span-4 space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Input Source</label>
                <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <select 
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all appearance-none"
                        value={item.sourceKey} onChange={e => updateRow({ sourceKey: e.target.value })}
                    >
                        <option value="">Link Input Question...</option>
                        {templateFields.map((f: any) => (
                            <option key={f.code} value={f.code}>{f.code} — {f.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="col-span-3 flex flex-col items-center gap-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Data Transformer</label>
                <button 
                    onClick={() => {
                        const currentIdx = TRANSFORMATION_TYPES.findIndex(t => t.value === item.transformation);
                        const nextIdx = (currentIdx + 1) % TRANSFORMATION_TYPES.length;
                        updateRow({ transformation: TRANSFORMATION_TYPES[nextIdx].value as any });
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all shadow-sm ${transformation.bg} border-transparent hover:border-indigo-200 group/btn`}
                >
                    <transformation.icon className={transformation.color} size={18} />
                    <div className="text-left flex-1">
                        <p className={`text-[11px] font-black ${transformation.color}`}>{transformation.label}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="col-span-4 space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Output Target</label>
                <div className="relative">
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <select 
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all appearance-none"
                        value={item.targetFieldPath} onChange={e => updateRow({ targetFieldPath: e.target.value })}
                    >
                        <option value="">Link Profile Database Field...</option>
                        {Object.entries(
                            WOREDA_PROFILE_FIELDS.reduce((acc: any, curr) => {
                                if (!acc[curr.group]) acc[curr.group] = [];
                                acc[curr.group].push(curr);
                                return acc;
                            }, {})
                        ).map(([group, fields]: [string, any]) => (
                            <optgroup key={group} label={group}>
                                {fields.map((f: any) => (
                                    <option key={f.path} value={f.path}>{f.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            <div className="col-span-1 pt-6 flex justify-end">
                <button 
                    onClick={removeRow} 
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {item.transformation === 'calculation' && (
                <div className="col-span-12 mt-4 p-8 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-indigo-100/50 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Calculator size={18} /></div>
                        <div>
                            <h5 className="text-sm font-black text-slate-900">Aggregation Logic</h5>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">Sum or Average Multiple Inputs</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aggregate Mode</label>
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl">
                                {['sum', 'average'].map(op => (
                                    <button 
                                        key={op}
                                        onClick={() => updateRow({ operation: op as any })}
                                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${item.operation === op ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        {op === 'sum' ? 'Σ Sum' : 'Ø Average'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Factors</label>
                            <select 
                                className="w-full px-6 py-4 rounded-3xl bg-white border border-slate-100 text-[11px] font-bold text-slate-700 shadow-sm"
                                onChange={e => {
                                    if (!e.target.value) return;
                                    const keys = [...(item.sourceKeys || [])];
                                    if (!keys.includes(e.target.value)) keys.push(e.target.value);
                                    updateRow({ sourceKeys: keys, sourceKey: keys[0] || '' });
                                    e.target.value = '';
                                }}
                            >
                                <option value="">+ Add Variable...</option>
                                {templateFields.map((f: any) => (
                                    <option key={f.code} value={f.code}>{f.code} — {f.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 p-4 bg-white/50 rounded-2xl border border-dashed border-indigo-100 min-h-[60px]">
                        {(item.sourceKeys || []).map((key, kIdx) => (
                            <div key={kIdx} className="flex items-center gap-2.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black group">
                                <Hash size={12} className="text-indigo-400" /> {key}
                                <button onClick={() => {
                                    const keys = (item.sourceKeys || []).filter((_, i) => i !== kIdx);
                                    updateRow({ sourceKeys: keys, sourceKey: keys[0] || '' });
                                }} className="text-slate-500 hover:text-rose-400 transition-colors ml-1"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {item.transformation === 'lookup' && (
                <div className="col-span-12 mt-4 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg"><Filter size={18} /></div>
                            <div>
                                <h5 className="text-sm font-black text-slate-900">Lookup Definition</h5>
                                <p className="text-[10px] font-bold text-amber-500 uppercase">Map specific values</p>
                            </div>
                        </div>
                        <button onClick={() => {
                            const opts = [...(item.lookupOptions || [])];
                            opts.push({ sourceValue: '', targetValue: '' });
                            updateRow({ lookupOptions: opts });
                        }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm"><Plus size={14} /> Add Pattern</button>
                    </div>

                    <div className="space-y-3">
                        {(item.lookupOptions || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm">
                                <input placeholder="Input" className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-50 text-[11px] font-bold" value={opt.sourceValue} onChange={e => {
                                    const newOpts = [...(item.lookupOptions || [])];
                                    newOpts[oIdx].sourceValue = e.target.value;
                                    updateRow({ lookupOptions: newOpts });
                                }} />
                                <ArrowRightLeft size={16} className="text-amber-500" />
                                <input placeholder="Target" className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-50 text-[11px] font-bold" value={opt.targetValue} onChange={e => {
                                    const newOpts = [...(item.lookupOptions || [])];
                                    newOpts[oIdx].targetValue = e.target.value;
                                    updateRow({ lookupOptions: newOpts });
                                }} />
                                <button onClick={() => {
                                    const newOpts = (item.lookupOptions || []).filter((_, i) => i !== oIdx);
                                    updateRow({ lookupOptions: newOpts });
                                }} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const MappingCard: React.FC<{ mapping: ProfileMapping; onEdit: () => void; onDelete: () => void }> = ({ mapping, onEdit, onDelete }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group flex flex-col justify-between">
        <div>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">{mapping.sourceType}</div>
                    {mapping.isActive && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</div>}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button onClick={onEdit} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit3 size={16} /></button>
                    <button onClick={onDelete} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{mapping.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{mapping.description || 'Seamlessly synchronize interview responses into your core database.'}</p>
        </div>
        <div>
            <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transformers</p>
                    <p className="text-lg font-black text-slate-900">{mapping.mappings.length}</p>
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Version</p>
                    <p className="text-lg font-black text-slate-900">v{mapping.version}</p>
                </div>
                <button onClick={onEdit} className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:bg-indigo-600 transition-colors"><ChevronRight size={20} /></button>
            </div>
            {mapping.createdBy && <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider mt-2">Architected by {mapping.createdBy.fullname}</p>}
        </div>
    </motion.div>
);

const MappingForm: React.FC<{ 
    initial: ProfileMapping | null; 
    templates: any[]; 
    onClose: () => void; 
    onSave: () => void 
}> = ({ initial, templates, onClose, onSave }) => {
    const [name, setName] = useState(initial?.name || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [sourceId, setSourceId] = useState(initial?.sourceId || '');
    const [mappings, setMappings] = useState<ProfileMappingItem[]>(initial?.mappings || []);
    const [saving, setSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'config' | 'mappings'>('config');

    useEffect(() => {
        if (sourceId) {
            const t = templates.find(temp => temp._id === sourceId);
            setSelectedTemplate(t);
        }
    }, [sourceId, templates]);

    const templateFields = useMemo(() => {
        if (!selectedTemplate) return [];
        return selectedTemplate.modules.flatMap((m: any) => 
            m.sections.flatMap((s: any) => s.fields.map((f: any) => ({
                code: f.questionCode,
                label: f.label
            })))
        );
    }, [selectedTemplate]);

    const handleSave = async () => {
        if (!name || !sourceId) return toast.error('Check your configuration settings');
        try {
            setSaving(true);
            const payload = { name, description, sourceType: 'InterviewTemplate' as const, sourceId, mappings };
            if (initial) {
                await updateProfileMapping(initial._id, payload);
                toast.success('Connector updated');
            } else {
                await createProfileMapping(payload);
                toast.success('Connector established');
            }
            onSave();
        } catch (error) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const autoMap = () => {
        if (!selectedTemplate) return toast.info('Link a template first');
        const newMappings = [...mappings];
        let count = 0;
        templateFields.forEach((tf: any) => {
            if (newMappings.some(m => m.sourceKey === tf.code)) return;
            const match = WOREDA_PROFILE_FIELDS.find(pf => 
                tf.label.toLowerCase().includes(pf.label.toLowerCase()) || 
                pf.label.toLowerCase().includes(tf.label.toLowerCase()) ||
                tf.code.toLowerCase().includes(pf.path.split('.').pop() || '')
            );
            if (match) {
                newMappings.push({ targetFieldPath: match.path, sourceKey: tf.code, transformation: 'direct' });
                count++;
            }
        });
        setMappings(newMappings);
        toast.success(`Connected ${count} fields automatically`);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} className="relative bg-white rounded-[3.5rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
                <div className="px-12 py-8 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.75rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100"><ArrowRightLeft size={30} /></div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{initial ? 'Tune Connector' : 'Forge New Connector'}</h2>
                                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">{mappings.length} Links</div>
                            </div>
                            <p className="text-sm font-medium text-slate-500 mt-1">Design the data flow between templates and your profile register.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex p-1.5 bg-white border border-slate-100 rounded-2xl mr-4 shadow-sm">
                            <button onClick={() => setActiveTab('config')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'config' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Properties</button>
                            <button onClick={() => setActiveTab('mappings')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'mappings' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Mapping Layer</button>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow-sm transition-all"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {activeTab === 'config' ? (
                        <div className="p-12 max-w-3xl mx-auto space-y-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2"><Settings2 size={18} className="text-indigo-600" /><h3 className="text-xl font-black text-slate-800 tracking-tight">Core Configuration</h3></div>
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Connector Metadata</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input className="col-span-2 px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 text-slate-900 font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="Connector name..." />
                                            <textarea className="col-span-2 px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 text-slate-900 font-bold min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Source Blueprint</label>
                                        <div className="p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100 border-dashed">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm"><Code size={18} /></div>
                                                    <div><p className="text-[10px] font-black text-indigo-400 uppercase">Input Type</p><p className="text-sm font-bold text-indigo-900">Digital Interview Template</p></div>
                                                </div>
                                                <select className="w-full px-6 py-4 rounded-3xl bg-white border border-indigo-100 text-slate-900 font-black" value={sourceId} onChange={e => setSourceId(e.target.value)}>
                                                    <option value="">Select an active template...</option>
                                                    {templates.map(t => <option key={t._id} value={t._id}>{t.name} (v{t.version})</option>)}
                                                </select>
                                                {selectedTemplate && <div className="flex items-center gap-6 px-2"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-slate-500 uppercase">{selectedTemplate.modules.length} Modules</span></div><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><span className="text-[10px] font-black text-slate-500 uppercase">{templateFields.length} Questions</span></div></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8"><button onClick={() => setActiveTab('mappings')} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 shadow-xl transition-all">Continue <ArrowRight /></button></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-12 space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600"><Binary size={20} /></div>
                                    <div><h3 className="text-xl font-black text-slate-800">Connection Points</h3><p className="text-xs font-semibold text-slate-400">Defining {mappings.length} transformers</p></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={autoMap} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase border border-emerald-100 shadow-sm"><Sparkles size={16} /> Smart Sync</button>
                                    <button onClick={() => setMappings([])} className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase border border-rose-100 shadow-sm">Wipe All</button>
                                    <button onClick={() => setMappings([...mappings, { targetFieldPath: '', sourceKey: '', transformation: 'direct' }])} className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black uppercase shadow-lg"><Plus size={16} /> New Link</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <AnimatePresence>{mappings.map((m, idx) => <MappingRow key={idx} item={m} idx={idx} templateFields={templateFields} updateRow={(updates) => setMappings(mappings.map((row, i) => i === idx ? { ...row, ...updates } : row))} removeRow={() => setMappings(mappings.filter((_, i) => i !== idx))} />)}</AnimatePresence>
                                {mappings.length === 0 && <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100"><Info size={48} className="text-slate-200 mb-4" /><p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Canvas Empty</p></div>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-12 py-6 bg-white border-t border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${name && sourceId ? 'bg-emerald-500' : 'bg-slate-200'}`} /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: {name && sourceId ? 'Ready' : 'Pending'}</span></div>
                        {selectedTemplate && <div className="flex items-center gap-2"><Box size={14} className="text-indigo-400" /><span className="text-[10px] font-black text-slate-800 uppercase max-w-[200px] truncate">Source: {selectedTemplate.name}</span></div>}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">Discard</button>
                        <button disabled={saving} onClick={handleSave} className="px-12 py-3.5 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black uppercase hover:bg-slate-900 transition-all shadow-xl flex items-center gap-3">
                            {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            {saving ? 'Syncing...' : initial ? 'Update Connector' : 'Commit Changes'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MappingConfig: React.FC = () => {
    const [mappings, setMappings] = useState<ProfileMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMapping, setEditingMapping] = useState<ProfileMapping | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [mList, tList] = await Promise.all([getProfileMappings(), api.get('/templates').then(r => r.data)]);
                setMappings(mList);
                setTemplates(tList);
            } catch (error) {
                toast.error('Failed to load mappings');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const fetchMappings = async () => {
        try {
            const data = await getProfileMappings();
            setMappings(data);
        } catch (error) {
            toast.error('Failed to update mappings list');
        }
    };

    const filteredMappings = mappings.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this mapping?')) return;
        try {
            await deleteProfileMapping(id);
            toast.success('Mapping deleted');
            fetchMappings();
        } catch (error) {
            toast.error('Failed to delete mapping');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1440px] mx-auto p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100"><Layers className="text-white" size={24} /></div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Profile Connectors</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Map interview data to your Woreda Profile database with precision.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search mappings..." className="pl-11 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 w-full md:w-[300px] font-medium" />
                        </div>
                        <button onClick={() => { setEditingMapping(null); setShowForm(true); }} className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"><Plus size={20} /> New Configuration</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100/50">
                        <div className="relative"><div className="w-16 h-16 border-4 border-indigo-50 rounded-full" /><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0" /></div>
                        <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Layer</p>
                    </div>
                ) : filteredMappings.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"><ArrowRightLeft size={40} className="text-slate-300" /></div>
                        <h3 className="text-2xl font-black text-slate-800">No Mappings Found</h3>
                        <p className="mt-8 px-8 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold inline-block cursor-pointer" onClick={() => setShowForm(true)}>Configure Now</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMappings.map(m => (
                            <MappingCard key={m._id} mapping={m} onEdit={() => { setEditingMapping(m); setShowForm(true); }} onDelete={() => handleDelete(m._id)} />
                        ))}
                    </div>
                )}

                <AnimatePresence>{showForm && <MappingForm initial={editingMapping} templates={templates} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); fetchMappings(); }} />}</AnimatePresence>
            </div>
        </div>
    );
};

export default MappingConfig;
