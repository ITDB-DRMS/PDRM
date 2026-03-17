import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    MapPin, Users, Home, Zap, ShieldCheck, Heart, Plus, X,
    Search, RefreshCw, ChevronRight, Loader2, BarChart3,
    FileText, CheckCircle, Clock, Edit3, Trash2, Eye,
    Building2, Wheat, AlertTriangle, ArrowLeft,
    Upload, FileSpreadsheet, ArrowRightLeft, AlertCircle
} from 'lucide-react';
import {
    getWoredaProfiles, getWoredaProfileStats, createWoredaProfile,
    updateWoredaProfile, deleteWoredaProfile, importWoredaProfile,
    syncFromInterview,
    type WoredaProfile as WProfile,
    type WoredaProfileInput,
    type WoredaProfileStats
} from '../../api/woredaProfileService';
import { getProfileMappings, type ProfileMapping } from '../../api/profileMappingService';

// ─── helpers ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'overview',    label: 'Overview',          icon: BarChart3 },
    { id: 'demographics',label: 'Demographics',       icon: Users },
    { id: 'livelihoods', label: 'Livelihoods',        icon: Wheat },
    { id: 'services',    label: 'Basic Services',     icon: Zap },
    { id: 'facilities',  label: 'Critical Facilities',icon: Building2 },
    { id: 'vulnerable',  label: 'Vulnerable Groups',  icon: Heart },
    { id: 'capacity',    label: 'Community Capacity', icon: ShieldCheck },
    { id: 'hazards',     label: 'Hazards & Risks',    icon: AlertTriangle },
    { id: 'risk',        label: 'Risk Assessment',    icon: BarChart3 },
    { id: 'indicators',  label: 'Social & Env. Indicators', icon: ShieldCheck },
];

const FACILITY_TYPES = ['Health Center', 'School', 'Police Station', 'Fire Station', 'Emergency Shelter'];
const LIVELIHOOD_TYPES = ['Agriculture', 'Livestock', 'Trade', 'Labor', 'Other'];
const EDUCATION_CATS = ['No Education', 'Primary', 'Secondary', 'Higher Education', 'Vocational'];
const VG_TYPES = ['Women-headed HH', 'Persons with Disability (PWD)', 'Elderly living alone', 'Orphans', 'Chronically ill'];
const CAPACITY_TYPES = ['Kebele DRM Committee', 'Community Volunteers', 'Early Warning System', 'Search & Rescue Team', 'First Aid Team'];

const statusColor = (s?: string) => {
    if (s === 'Submitted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'Reviewed')  return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
};

const emptyProfile = (): WoredaProfileInput => ({
    location: { subcity: '', woreda: '', block: '', house_no: '' },
    assessment_date: new Date().toISOString().split('T')[0],
    remarks: '',
    demographics: { total_population: 0, male_population: 0, female_population: 0, children_0_17: 0, youth_18_29: 0, adults_30_59: 0, elderly_60_plus: 0, total_households: 0, female_headed_households: 0, informal_settlement_population: 0, low_income_households: 0, unemployment_rate: 0, internally_displaced_population: 0, education_levels: EDUCATION_CATS.map(c => ({ category: c, count: 0 })) },
    livelihoods: LIVELIHOOD_TYPES.map(t => ({ livelihood_type: t, households: 0, percentage: 0 })),
    basic_services: { water_source: '', electricity: false, road_access: '', drainage_system_coverage: false, solid_waste_management_coverage: false, telecommunications_access: false, critical_lifeline_redundancy: false },
    critical_facilities: FACILITY_TYPES.map(f => ({ facility_type: f, distance_to_nearest_emergency_service: 0, structural_safety: '', emergency_equipment_available: false })),
    vulnerable_groups: VG_TYPES.map(t => ({ group_type: t, number: 0 })),
    community_capacity: CAPACITY_TYPES.map(t => ({ capacity_type: t, available: false, remarks: '' })),
    hazards: [],
    vulnerability_assessments: [],
    capacity_assessments: [],
    risk_assessments: [],
    status: 'Draft',
});

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className={`relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
        <Icon size={64} className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform" />
    </div>
);

// ─── Profile Card ────────────────────────────────────────────────────────────
const ProfileCard: React.FC<{ profile: WProfile; onView: () => void; onEdit: () => void; onDelete: () => void }> = ({ profile, onView, onEdit, onDelete }) => (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all p-6 group cursor-pointer"
        onClick={onView}>
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <MapPin size={22} className="text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{profile.location.woreda} Woreda</h3>
                    <p className="text-xs text-slate-400">{profile.location.subcity} Subcity</p>
                </div>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusColor(profile.status)}`}>{profile.status}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{(profile.demographics?.total_population || 0).toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Pop.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{(profile.vulnerable_groups?.reduce((a, g) => a + (g.number || 0), 0) || 0).toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Vuln.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{profile.risk_index?.overall_woreda_risk_score || '—'}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Risk</p>
            </div>
            <div className={`rounded-2xl p-3 text-center ${profile.status === 'Submitted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <p className="text-lg font-black">{(profile.risk_assessments?.length || 0)}</p>
                <p className="text-[9px] uppercase tracking-wider">Hazards</p>
            </div>
        </div>
        <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">{new Date(profile.assessment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={onEdit} className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 flex items-center justify-center transition-all"><Edit3 size={14} /></button>
                <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                <button onClick={onView} className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><ChevronRight size={14} /></button>
            </div>
        </div>
    </motion.div>
);

// ─── Form Wizard ─────────────────────────────────────────────────────────────
const STEPS = ['Location', 'Demographics', 'Livelihoods', 'Basic Services', 'Critical Facilities', 'Vulnerable Groups', 'Capacity'];

const FormWizard: React.FC<{ initial?: WProfile | null; onSave: (d: WoredaProfileInput) => void; onClose: () => void; saving: boolean }> = ({ initial, onSave, onClose, saving }) => {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<WoredaProfileInput>(initial ? {
        location: initial.location,
        assessment_date: initial.assessment_date?.toString().split('T')[0] || '',
        remarks: initial.remarks,
        demographics: initial.demographics,
        livelihoods: initial.livelihoods?.length ? initial.livelihoods : emptyProfile().livelihoods,
        basic_services: initial.basic_services,
        critical_facilities: initial.critical_facilities?.length ? initial.critical_facilities : emptyProfile().critical_facilities,
        vulnerable_groups: initial.vulnerable_groups?.length ? initial.vulnerable_groups : emptyProfile().vulnerable_groups,
        community_capacity: initial.community_capacity?.length ? initial.community_capacity : emptyProfile().community_capacity,
        status: initial.status,
    } : emptyProfile());

    const setLoc = (k: string, v: string) => setForm(f => ({ ...f, location: { ...f.location, [k]: v } }));
    const setDemo = (k: string, v: number | string) => setForm(f => ({ ...f, demographics: { ...f.demographics, [k]: v } }));
    const setSvc = (k: string, v: boolean | string) => setForm(f => ({ ...f, basic_services: { ...f.basic_services, [k]: v } }));

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{initial ? 'Edit' : 'New'} Woreda Profile</p>
                        <h2 className="text-xl font-black text-slate-900">Step {step + 1}: {STEPS[step]}</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"><X size={18} /></button>
                </div>

                {/* Step indicator */}
                <div className="px-8 py-4 flex gap-2 border-b border-slate-50">
                    {STEPS.map((_, i) => (
                        <button key={i} onClick={() => setStep(i)}
                            className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            {[['subcity','Subcity'],['woreda','Woreda'],['block','Block'],['house_no','House No']].map(([k,l]) => (
                                <div key={k} className={k === 'block' || k === 'house_no' ? 'col-span-1' : ''}>
                                    <label className={labelCls}>{l}</label>
                                    <input className={inputCls} value={(form.location as any)[k] || ''} onChange={e => setLoc(k, e.target.value)} placeholder={`Enter ${l}`} />
                                </div>
                            ))}
                            <div><label className={labelCls}>Assessment Date</label><input type="date" className={inputCls} value={form.assessment_date} onChange={e => setForm(f => ({ ...f, assessment_date: e.target.value }))} /></div>
                            <div className="col-span-2"><label className={labelCls}>Remarks</label><textarea className={inputCls} rows={2} value={form.remarks || ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {[['total_population','Total Population'],['male_population','Male'],['female_population','Female'],['children_0_17','Children (0–17)'],['youth_18_29','Youth (18–29)'],['adults_30_59','Adults (30–59)'],['elderly_60_plus','Elderly (60+)'],['total_households','Total Households'],['female_headed_households','Female-headed HH'],['informal_settlement_population','Informal Settlement Pop.'],['low_income_households','Low-income HH'],['unemployment_rate','Unemployment Rate (%)'],['internally_displaced_population','IDPs']].map(([k,l]) => (
                                    <div key={k}>
                                        <label className={labelCls}>{l}</label>
                                        <input type="number" min={0} className={inputCls} value={(form.demographics as any)?.[k] || 0} onChange={e => setDemo(k, Number(e.target.value))} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-3">Education Levels</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {(form.demographics?.education_levels || []).map((e, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                                            <span className="text-xs font-semibold text-slate-600 flex-1">{e.category}</span>
                                            <input type="number" min={0} className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-indigo-300" value={e.count || 0}
                                                onChange={ev => setForm(f => ({ ...f, demographics: { ...f.demographics, education_levels: f.demographics?.education_levels?.map((ed, idx) => idx === i ? { ...ed, count: Number(ev.target.value) } : ed) } }))} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            {(form.livelihoods || []).map((l, i) => (
                                <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-2xl px-5 py-4">
                                    <span className="flex-1 text-sm font-bold text-slate-700">{l.livelihood_type}</span>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-slate-400">HH</label>
                                        <input type="number" min={0} className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-center focus:outline-none focus:border-indigo-300" value={l.households || 0}
                                            onChange={e => setForm(f => ({ ...f, livelihoods: f.livelihoods?.map((lv, idx) => idx === i ? { ...lv, households: Number(e.target.value) } : lv) }))} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-slate-400">%</label>
                                        <input type="number" min={0} max={100} className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-center focus:outline-none focus:border-indigo-300" value={l.percentage || 0}
                                            onChange={e => setForm(f => ({ ...f, livelihoods: f.livelihoods?.map((lv, idx) => idx === i ? { ...lv, percentage: Number(e.target.value) } : lv) }))} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className={labelCls}>Water Source</label><input className={inputCls} value={form.basic_services?.water_source || ''} onChange={e => setSvc('water_source', e.target.value)} placeholder="e.g. Piped Water, Borehole" /></div>
                            <div><label className={labelCls}>Road Access</label>
                                <select className={inputCls} value={form.basic_services?.road_access || ''} onChange={e => setSvc('road_access', e.target.value)}>
                                    <option value="">Select</option>
                                    {['All-weather', 'Seasonal', 'No road'].map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            {[['electricity','Electricity Access'],['drainage_system_coverage','Drainage System'],['solid_waste_management_coverage','Solid Waste Mgmt'],['telecommunications_access','Telecommunications'],['critical_lifeline_redundancy','Lifeline Redundancy']].map(([k,l]) => (
                                <div key={k} className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4">
                                    <span className="text-sm font-semibold text-slate-700">{l}</span>
                                    <button type="button"
                                        onClick={() => setSvc(k, !(form.basic_services as any)?.[k])}
                                        className={`w-12 h-6 rounded-full transition-all relative ${(form.basic_services as any)?.[k] ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${(form.basic_services as any)?.[k] ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3">
                            {(form.critical_facilities || []).map((f, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-5">
                                    <p className="text-sm font-bold text-slate-800 mb-3">{f.facility_type}</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className={labelCls}>Distance (km)</label>
                                            <input type="number" min={0} className={inputCls} value={f.distance_to_nearest_emergency_service || 0}
                                                onChange={e => setForm(fr => ({ ...fr, critical_facilities: fr.critical_facilities?.map((cf, idx) => idx === i ? { ...cf, distance_to_nearest_emergency_service: Number(e.target.value) } : cf) }))} />
                                        </div>
                                        <div><label className={labelCls}>Structural Safety</label>
                                            <select className={inputCls} value={f.structural_safety || ''} onChange={e => setForm(fr => ({ ...fr, critical_facilities: fr.critical_facilities?.map((cf, idx) => idx === i ? { ...cf, structural_safety: e.target.value } : cf) }))}>
                                                <option value="">Select</option>
                                                {['Good', 'Fair', 'Poor'].map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <label className={labelCls}>Emergency Equipment</label>
                                            <button type="button"
                                                onClick={() => setForm(fr => ({ ...fr, critical_facilities: fr.critical_facilities?.map((cf, idx) => idx === i ? { ...cf, emergency_equipment_available: !cf.emergency_equipment_available } : cf) }))}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${f.emergency_equipment_available ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                <CheckCircle size={16} /> {f.emergency_equipment_available ? 'Available' : 'Not Available'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-3">
                            {(form.vulnerable_groups || []).map((g, i) => (
                                <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-2xl px-5 py-4">
                                    <span className="flex-1 text-sm font-bold text-slate-700">{g.group_type}</span>
                                    <input type="number" min={0} className="w-32 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-center focus:outline-none focus:border-indigo-300" value={g.number || 0}
                                        onChange={e => setForm(f => ({ ...f, vulnerable_groups: f.vulnerable_groups?.map((vg, idx) => idx === i ? { ...vg, number: Number(e.target.value) } : vg) }))} />
                                    <span className="text-xs text-slate-400">people</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-3">
                            {(form.community_capacity || []).map((c, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-800">{c.capacity_type}</span>
                                        <button type="button"
                                            onClick={() => setForm(f => ({ ...f, community_capacity: f.community_capacity?.map((cc, idx) => idx === i ? { ...cc, available: !cc.available } : cc) }))}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${c.available ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                            <CheckCircle size={14} /> {c.available ? 'Available' : 'Not Available'}
                                        </button>
                                    </div>
                                    <input className={`${inputCls} !py-2`} placeholder="Remarks (optional)" value={c.remarks || ''}
                                        onChange={e => setForm(f => ({ ...f, community_capacity: f.community_capacity?.map((cc, idx) => idx === i ? { ...cc, remarks: e.target.value } : cc) }))} />
                                </div>
                            ))}
                            <div className="pt-2">
                                <label className={labelCls}>Status</label>
                                <div className="flex gap-3">
                                    {['Draft', 'Submitted', 'Reviewed'].map(s => (
                                        <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s as any }))}
                                            className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${form.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-white">
                    <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        <ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            Next →
                        </button>
                    ) : (
                        <button disabled={saving} onClick={() => onSave(form)} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {saving ? 'Saving…' : 'Save Profile'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Detail View ─────────────────────────────────────────────────────────────
const DetailView: React.FC<{ profile: WProfile; onBack: () => void; onEdit: () => void }> = ({ profile, onBack, onEdit }) => {
    const [tab, setTab] = useState('overview');
    const d = profile.demographics;
    const totalVulnerable = profile.vulnerable_groups?.reduce((a, g) => a + (g.number || 0), 0) || 0;

    const InfoRow: React.FC<{ label: string; value: string | number | boolean | undefined }> = ({ label, value }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <span className="text-xs font-semibold text-slate-400">{label}</span>
            <span className="text-sm font-bold text-slate-800">{value === true ? '✅ Yes' : value === false ? '❌ No' : value ?? '—'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-all"><ArrowLeft size={18} /></button>
                    <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Woreda Profile</p>
                        <h2 className="text-2xl font-black text-slate-900">{profile.location.woreda} Woreda</h2>
                        <p className="text-xs text-slate-400">{profile.location.subcity} Subcity</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-4 py-2 rounded-full border ${statusColor(profile.status)}`}>{profile.status}</span>
                    <button onClick={onEdit} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <Edit3 size={14} /> Edit
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon size={13} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                {tab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Population" value={(d?.total_population || 0).toLocaleString()} icon={Users} color="text-indigo-700" />
                            <StatCard label="Households" value={(d?.total_households || 0).toLocaleString()} icon={Home} color="text-emerald-700" />
                            <StatCard label="Vulnerable People" value={totalVulnerable.toLocaleString()} icon={Heart} color="text-rose-600" />
                            <StatCard label="Unemployment" value={`${d?.unemployment_rate || 0}%`} icon={AlertTriangle} color="text-amber-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assessment Info</p>
                                <InfoRow label="Date" value={new Date(profile.assessment_date).toLocaleDateString('en-GB')} />
                                <InfoRow label="Assessed By" value={(profile.assessed_by as any)?.fullname || 'Woreda DRM Office'} />
                                <InfoRow label="Remarks" value={profile.remarks} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Population Breakdown</p>
                                <InfoRow label="Male" value={`${d?.male_population?.toLocaleString() || 0}`} />
                                <InfoRow label="Female" value={`${d?.female_population?.toLocaleString() || 0}`} />
                                <InfoRow label="Children (0–17)" value={`${d?.children_0_17?.toLocaleString() || 0}`} />
                                <InfoRow label="Youth (18–29)" value={`${d?.youth_18_29?.toLocaleString() || 0}`} />
                                <InfoRow label="Elderly (60+)" value={`${d?.elderly_60_plus?.toLocaleString() || 0}`} />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'demographics' && d && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[['Total Population', d.total_population],['Male', d.male_population],['Female', d.female_population],['Children 0–17', d.children_0_17],['Youth 18–29', d.youth_18_29],['Adults 30–59', d.adults_30_59],['Elderly 60+', d.elderly_60_plus],['Total Households', d.total_households],['Female-headed HH', d.female_headed_households],['Informal Settlement', d.informal_settlement_population],['Low Income HH', d.low_income_households],['IDPs', d.internally_displaced_population]].map(([l, v]) => (
                                <div key={String(l)} className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{l}</p>
                                    <p className="text-2xl font-black text-slate-900">{(v as number)?.toLocaleString() ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                        {d.education_levels?.length ? (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Education Levels</p>
                                <div className="space-y-2">
                                    {d.education_levels.map((e, i) => {
                                        const pct = d.total_population ? Math.round((e.count / d.total_population) * 100) : 0;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="w-40 text-xs font-semibold text-slate-600">{e.category}</span>
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-12 text-xs font-bold text-slate-700 text-right">{e.count.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {tab === 'livelihoods' && (
                    <div className="space-y-3">
                        {profile.livelihoods?.map((l, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Wheat size={18} className="text-amber-600" /></div>
                                <span className="flex-1 font-bold text-slate-800">{l.livelihood_type}</span>
                                <div className="text-right">
                                    <p className="text-lg font-black text-slate-900">{l.percentage ?? 0}%</p>
                                    <p className="text-[10px] text-slate-400">{(l.households || 0).toLocaleString()} HH</p>
                                </div>
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${l.percentage || 0}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'services' && profile.basic_services && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 col-span-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Water Source</p>
                            <p className="text-lg font-black text-slate-900">{profile.basic_services.water_source || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Road Access</p>
                            <p className="text-lg font-black text-slate-900">{profile.basic_services.road_access || '—'}</p>
                        </div>
                        {[['electricity','Electricity'],['drainage_system_coverage','Drainage System'],['solid_waste_management_coverage','Solid Waste Mgmt'],['telecommunications_access','Telecommunications'],['critical_lifeline_redundancy','Lifeline Redundancy']].map(([k,l]) => (
                            <div key={k} className={`flex items-center gap-3 rounded-2xl p-5 ${(profile.basic_services as any)[k] ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${(profile.basic_services as any)[k] ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    {(profile.basic_services as any)[k] ? <CheckCircle size={18} className="text-emerald-600" /> : <X size={18} className="text-slate-400" />}
                                </div>
                                <span className={`font-bold text-sm ${(profile.basic_services as any)[k] ? 'text-emerald-700' : 'text-slate-500'}`}>{l}</span>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'facilities' && (
                    <div className="space-y-4">
                        {profile.critical_facilities?.map((f, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-5 flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"><Building2 size={20} className="text-slate-500" /></div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900">{f.facility_type}</p>
                                    <p className="text-xs text-slate-400">{f.distance_to_nearest_emergency_service ?? '—'} km away</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Safety</p>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${f.structural_safety === 'Good' ? 'bg-emerald-100 text-emerald-700' : f.structural_safety === 'Fair' ? 'bg-amber-100 text-amber-700' : f.structural_safety === 'Poor' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>{f.structural_safety || 'N/A'}</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Equipment</p>
                                        <span className={`text-xs font-bold ${f.emergency_equipment_available ? 'text-emerald-600' : 'text-slate-400'}`}>{f.emergency_equipment_available ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'vulnerable' && (
                    <div className="space-y-3">
                        {profile.vulnerable_groups?.map((g, i) => {
                            const pct = d?.total_population ? Math.round((g.number! / d.total_population) * 100) : 0;
                            return (
                                <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center"><Heart size={16} className="text-rose-500" /></div>
                                    <span className="flex-1 font-bold text-slate-800">{g.group_type}</span>
                                    <p className="text-2xl font-black text-slate-900 w-16 text-right">{(g.number || 0).toLocaleString()}</p>
                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                    <span className="w-10 text-xs font-bold text-slate-500">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'capacity' && (
                    <div className="space-y-3">
                        {profile.community_capacity?.map((c, i) => (
                            <div key={i} className={`flex items-center gap-4 rounded-2xl p-5 border ${c.available ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.available ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    <ShieldCheck size={18} className={c.available ? 'text-emerald-600' : 'text-slate-400'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${c.available ? 'text-emerald-800' : 'text-slate-600'}`}>{c.capacity_type}</p>
                                    {c.remarks && <p className="text-xs text-slate-400 mt-0.5">{c.remarks}</p>}
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{c.available ? 'Available' : 'Not Available'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'hazards' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Community Hazards</p>
                            {profile.hazards?.length ? profile.hazards.map((h, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-black text-slate-900">{h.hazard_name}</p>
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${h.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>Severity: {h.severity}</span>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-700">Freq: {h.frequency}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-slate-400 uppercase">Seasonality</p><p className="text-xs font-bold text-slate-700">{h.seasonality || 'N/A'}</p></div>
                                        <div><p className="text-[9px] text-slate-400 uppercase">History</p><p className="text-xs text-slate-600">{h.historical_events || 'No history recorded'}</p></div>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-400 italic">No hazard data recorded.</p>}
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vulnerability Assessments</p>
                            {profile.vulnerability_assessments?.length ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.vulnerability_assessments.map((v, i) => (
                                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{v.hazard_name}</p>
                                            <p className="font-bold text-slate-800 mb-2">{v.element_at_risk}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${v.vulnerability_level === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{v.vulnerability_level} Risk</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed"><span className="font-bold">Reason:</span> {v.reasons}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-400 italic">No vulnerability data recorded.</p>}
                        </div>
                    </div>
                )}

                {tab === 'risk' && (
                    <div className="space-y-8">
                        {profile.risk_index && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[['Hazard', profile.risk_index.hazard_index, 'text-rose-600'], ['Vulnerability', profile.risk_index.vulnerability_index, 'text-amber-600'], ['Exposure', profile.risk_index.exposure_index, 'text-orange-600'], ['Capacity', profile.risk_index.capacity_index, 'text-emerald-600'], ['Score', profile.risk_index.overall_woreda_risk_score, 'text-indigo-700 bg-indigo-50 rounded-2xl pt-2']].map(([l, v, c]) => (
                                    <div key={String(l)} className={`text-center p-3 ${String(c)}`}>
                                        <p className="text-[9px] font-bold uppercase tracking-wider">{l}</p>
                                        <p className="text-2xl font-black">{v ?? '—'}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Evaluation</p>
                            {profile.risk_assessments?.length ? profile.risk_assessments.map((r, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-3xl items-start">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center min-w-[100px]">
                                        <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Score</p>
                                        <p className="text-3xl font-black text-slate-900">{r.risk_score}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.risk_level?.includes('High') ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>{r.risk_level}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">#{r.priority_rank}</span>
                                            <h4 className="font-bold text-slate-900 text-lg">{r.hazard_name} Risk</h4>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Recommended Action</p>
                                            <p className="text-sm text-indigo-900 font-medium">{r.recommended_action}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-400 italic">No risk assessments recorded.</p>}
                        </div>

                        {profile.capacity_assessments?.length ? (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity Indices</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {profile.capacity_assessments.map((c, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl transition-all hover:shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-indigo-500 uppercase">{c.hazard_name}</p>
                                                <p className="text-sm font-bold text-slate-800">{c.capacity_type}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${c.capacity_level === 'Strong' ? 'bg-emerald-100 text-emerald-700' : c.capacity_level === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{c.capacity_level}</span>
                                                {c.remarks && <p className="text-[10px] text-slate-400 mt-1">{c.remarks}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {tab === 'indicators' && (
                    <div className="space-y-12">
                        {/* Economic Risk Indicators */}
                        <section>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Economic Risk
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    ['Informal Businesses', profile.economic_risk_indicators?.concentration_small_informal_businesses],
                                    ['Market Exposure', profile.economic_risk_indicators?.market_exposure],
                                    ['Daily Labor Dependency', profile.economic_risk_indicators?.daily_labor_dependency],
                                    ['Business Interruption', profile.economic_risk_indicators?.business_interruption_risk],
                                    ['Industrial Exposure', profile.economic_risk_indicators?.industrial_hazard_exposure],
                                    ['Insurance Coverage', profile.economic_risk_indicators?.insurance_coverage_level],
                                ].map(([label, val]) => (
                                    <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                        <p className="text-sm font-black text-slate-900">{val || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Environmental Indicators */}
                        <section>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Environmental
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    ['Green Space / Capita', profile.environmental_indicators?.green_space_per_capita],
                                    ['Wetland Encroachment', profile.environmental_indicators?.wetland_encroachment],
                                    ['Soil Sealing', profile.environmental_indicators?.soil_sealing_coverage],
                                    ['Waste Dumping', profile.environmental_indicators?.waste_dumping_sites],
                                    ['Drainage Blockage', profile.environmental_indicators?.urban_drainage_blockage_frequency],
                                    ['Pollution Hotspots', profile.environmental_indicators?.pollution_hotspots],
                                ].map(([label, val]) => (
                                    <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                        <p className="text-sm font-black text-slate-900">{val || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Preparedness & Recovery */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Preparedness
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        ['Shelters Availability', profile.preparedness_indicators?.emergency_shelters_availability],
                                        ['Evacuation Mapping', profile.preparedness_indicators?.evacuation_routes_mapped],
                                        ['Firefighting Equip.', profile.preparedness_indicators?.firefighting_equipment_availability],
                                        ['Ambulance Coverage', profile.preparedness_indicators?.ambulance_coverage],
                                        ['Emergency Drills', profile.preparedness_indicators?.emergency_drills_frequency],
                                        ['Community Awareness', profile.preparedness_indicators?.community_awareness_level],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <span className="text-xs font-bold text-slate-600">{label}</span>
                                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">{val || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Recovery
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        ['Recovery Plans', profile.recovery_indicators?.post_disaster_recovery_plans],
                                        ['Livelihood Divers.', profile.recovery_indicators?.livelihood_diversification],
                                        ['Credit Access', profile.recovery_indicators?.access_to_credit_safety_nets],
                                        ['Self-Help Groups', profile.recovery_indicators?.community_self_help_groups],
                                        ['Urban Upgrading', profile.recovery_indicators?.urban_upgrading_programs],
                                        ['Climate Adaptation', profile.recovery_indicators?.climate_adaptation_initiatives],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <span className="text-xs font-bold text-slate-600">{label}</span>
                                            <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full">{val || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Import Modal ────────────────────────────────────────────────────────────
const ImportModal: React.FC<{
    onClose: () => void;
    onImport: (file: File, params: string) => void;
    importing: boolean
}> = ({ onClose, onImport, importing }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewProfiles, setPreviewProfiles] = useState<any[] | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handlePreview = async () => {
        if (!file) return;
        try {
            setPreviewLoading(true);
            const data = await importWoredaProfile(file, { dryRun: true });
            setPreviewProfiles(data.profiles);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to parse Excel');
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`relative bg-white rounded-[2.5rem] w-full ${previewProfiles ? 'max-w-4xl' : 'max-w-md'} flex flex-col shadow-2xl border border-slate-100 overflow-hidden transition-all duration-500`}>

                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            {previewProfiles ? 'Review Imported Data' : 'Import Excel'}
                        </h2>
                        <p className="text-xs text-slate-400">
                            {previewProfiles ? `Extracted ${previewProfiles.length} profiles from "${file?.name}"` : 'Upload your Woreda Profile Excel file'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"><X size={18} /></button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[60vh]">
                    {!previewProfiles ? (
                        <div className="space-y-6">
                            <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}>
                                <input type="file" id="excel-upload" className="hidden" accept=".xlsx, .xls" onChange={e => { setFile(e.target.files?.[0] || null); setPreviewProfiles(null); }} />
                                <label htmlFor="excel-upload" className="flex flex-col items-center cursor-pointer text-center">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${file ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                                        {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
                                    </div>
                                    {file ? (
                                        <>
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-slate-700">Click to upload or drag & drop</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Accepts .xlsx, .xls files</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            {file && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                        <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-2">Import Requirements</h4>
                                        <ul className="space-y-1.5">
                                            <li className="flex items-center gap-2 text-[10px] text-indigo-700 font-medium">
                                                <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                                Sheets: admin_location, community, demographics, livelihoods
                                            </li>
                                            <li className="flex items-center gap-2 text-[10px] text-indigo-700 font-medium">
                                                <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                                Required Columns: location_id, subcity, woreda, assessment_date
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                        Note: Excel imports use the standardized format. No profile mapping is required for this method.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subcity</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Woreda</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Population</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previewProfiles.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-slate-800">{p.location.subcity}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-slate-800">{p.location.woreda}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-black text-indigo-600">{p.demographics?.total_population?.toLocaleString() || 'N/A'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs text-slate-600 font-medium">{p.assessment_date ? new Date(p.assessment_date).toLocaleDateString() : 'N/A'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-slate-50 flex items-center gap-3 bg-white">
                    <button onClick={() => { if (previewProfiles) setPreviewProfiles(null); else onClose(); }}
                        className="px-6 py-3 rounded-2xl border border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        {previewProfiles ? 'Back' : 'Cancel'}
                    </button>
                    {!previewProfiles ? (
                        <button disabled={!file || previewLoading} onClick={handlePreview} className="flex-1 py-3 px-6 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            {previewLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                            {previewLoading ? 'Analyzing…' : 'Review Data'}
                        </button>
                    ) : (
                        <>
                            <button disabled={importing} onClick={() => file && onImport(file, JSON.stringify({ status: 'Draft' }))} className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                {importing ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                Save as Draft
                            </button>
                            <button disabled={importing} onClick={() => file && onImport(file, JSON.stringify({ status: 'Submitted' }))} className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                                {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Submit for Registration
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Sync Interview Modal ───────────────────────────────────────────────────
const SyncInterviewModal: React.FC<{
    onClose: () => void;
    onSync: (data: { responseId: string; mappingId: string; dryRun?: boolean }) => Promise<void>;
    mappings: ProfileMapping[];
    syncing: boolean;
}> = ({ onClose, onSync, mappings, syncing }) => {
    const [responseId, setResponseId] = useState('');
    const [mappingId, setMappingId] = useState('');
    const [isDryRun, setIsDryRun] = useState(true);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-md flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Sync from Interview</h2>
                        <p className="text-xs text-slate-400">Import profile data from a specific interview response</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"><X size={18} /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Response ID</label>
                        <input 
                            className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                            value={responseId} onChange={e => setResponseId(e.target.value)} placeholder="Enter Interview Response ID"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Mapping Configuration</label>
                            <Link to="/admin/profile-mapping" className="text-[10px] font-bold text-indigo-600 hover:underline">Create New Mapping</Link>
                        </div>
                        <select 
                            className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                            value={mappingId} onChange={e => setMappingId(e.target.value)}
                        >
                            <option value="">Select a mapping...</option>
                            {mappings.filter(m => m.sourceType === 'InterviewTemplate').map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <Eye size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-900">Dry Run First</p>
                                <p className="text-[10px] text-indigo-500">Preview changes before applying</p>
                            </div>
                        </div>
                        <button type="button"
                            onClick={() => setIsDryRun(!isDryRun)}
                            className={`w-12 h-6 rounded-full transition-all relative ${isDryRun ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isDryRun ? 'left-6' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-white">
                    <button 
                        disabled={!responseId || !mappingId || syncing} 
                        onClick={() => onSync({ responseId, mappingId, dryRun: isDryRun })} 
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        {syncing ? 'Synchronizing...' : isDryRun ? 'Review Sync' : 'Apply Synchronization'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Sync Preview Modal ─────────────────────────────────────────────────────
const SyncPreviewModal: React.FC<{
    data: any;
    onClose: () => void;
    onConfirm: () => void;
    syncing: boolean;
}> = ({ data, onClose, onConfirm, syncing }) => {
    const profile = data.data; // The transformed profile data
    const errors = data.validationErrors || [];

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Sync Preview</h2>
                        <p className="text-xs text-slate-400">Review transformed data before saving</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {errors.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                            <h4 className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle size={14} /> Validation Warnings
                            </h4>
                            <ul className="space-y-1">
                                {errors.map((err: any, idx: number) => (
                                    <li key={idx} className="text-rose-600 text-xs font-medium">• {err.message} ({err.field})</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Location & Identity</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Woreda</p>
                                    <p className="text-sm font-black text-slate-800">{profile.location?.woreda || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Subcity</p>
                                    <p className="text-sm font-black text-slate-800">{profile.location?.subcity || 'N/A'}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mapped Demographics</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Pop</p>
                                    <p className="text-sm font-black text-slate-800">{profile.demographics?.total_population || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Households</p>
                                    <p className="text-sm font-black text-slate-800">{profile.demographics?.total_households || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">HH Managed By Women</p>
                                    <p className="text-sm font-black text-slate-800">{profile.demographics?.female_headed_households || 0}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Full Data Object (JSON)</h4>
                            <pre className="text-[10px] font-mono text-indigo-700 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(profile, null, 2)}
                            </pre>
                        </section>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-white flex items-center gap-4">
                    <button onClick={onClose} className="px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all flex-1">
                        Cancel
                    </button>
                    <button 
                        disabled={syncing} 
                        onClick={onConfirm} 
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 flex-[2]"
                    >
                        {syncing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        {syncing ? 'Applying Changes...' : 'Confirm & Save Profile'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WoredaProfile: React.FC = () => {
    const [profiles, setProfiles] = useState<WProfile[]>([]);
    const [stats, setStats] = useState<WoredaProfileStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [mappings, setMappings] = useState<ProfileMapping[]>([]);
    const [editProfile, setEditProfile] = useState<WProfile | null>(null);
    const [viewProfile, setViewProfile] = useState<WProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [syncPreviewData, setSyncPreviewData] = useState<any | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pList, pStats, mList] = await Promise.all([
                getWoredaProfiles(), 
                getWoredaProfileStats(),
                getProfileMappings()
            ]);
            setProfiles(pList);
            setStats(pStats);
            setMappings(mList);
        } catch {
            toast.error('Failed to load Woreda Profiles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (data: WoredaProfileInput) => {
        try {
            setSaving(true);
            if (editProfile) {
                await updateWoredaProfile(editProfile._id, data);
                toast.success('Profile updated successfully');
            } else {
                await createWoredaProfile(data);
                toast.success('Profile created successfully');
            }
            setShowForm(false);
            setEditProfile(null);
            fetchData();
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleImport = async (file: File, paramsJson: string) => {
        try {
            const params = JSON.parse(paramsJson);
            setImporting(true);
            
            // For standard Excel import, mappingId is not required.
            // We only pass status and dryRun if applicable.
            const result = await importWoredaProfile(file, { 
                status: params.status,
                mappingId: params.mappingId 
            });
            
            toast.success(result.message || 'Import successful');
            setShowImport(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import Excel');
        } finally {
            setImporting(false);
        }
    };

    const handleSync = async (data: { responseId: string; mappingId: string; dryRun?: boolean }) => {
        try {
            setSaving(true);
            const result = await syncFromInterview(data);
            if (data.dryRun) {
                setSyncPreviewData({ ...result, requestData: data });
                setShowSync(false);
                toast.info('Dry run successful. Please review the preview.');
            } else {
                toast.success('Data synchronized successfully');
                setShowSync(false);
                setSyncPreviewData(null);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Synchronization failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this Woreda Profile?')) return;
        try {
            await deleteWoredaProfile(id);
            toast.success('Profile deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete profile');
        }
    };

    const filtered = profiles.filter(p =>
        [p.location.woreda, p.location.subcity].some(v =>
            v?.toLowerCase().includes(search.toLowerCase())
        )
    );

    if (viewProfile) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-6">
                <PageMeta title={`${viewProfile.location.woreda} Profile | IDRMIS`} description="Woreda Profile Detail" />
                <DetailView profile={viewProfile} onBack={() => setViewProfile(null)} onEdit={() => { setEditProfile(viewProfile); setViewProfile(null); setShowForm(true); }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <PageMeta title="Woreda Profile | IDRMIS" description="Community disaster risk profile management" />

            {/* Page Header */}
            <div className="px-6 pt-2 pb-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <MapPin size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Woreda Profile</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Community DRM profiles & vulnerability assessments</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-all"><RefreshCw size={16} /></button>
                        <button 
                            onClick={() => {
                                if (mappings.length === 0) {
                                    toast.warn('No profile mappings configured. Please create one first.');
                                }
                                setShowSync(true);
                            }} 
                            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ArrowRightLeft size={16} className="text-indigo-600" /> Sync Interview
                        </button>
                        <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                            <Upload size={16} className="text-indigo-600" /> Import Excel
                        </button>
                        <button onClick={() => { setEditProfile(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            <Plus size={16} /> New Profile
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <StatCard label="Total Profiles" value={stats.total} icon={FileText} color="text-slate-900" />
                        <StatCard label="Submitted" value={stats.submitted} icon={CheckCircle} color="text-emerald-700" />
                        <StatCard label="Draft" value={stats.draft} icon={Clock} color="text-amber-600" />
                        <StatCard label="Reviewed" value={stats.reviewed} icon={Eye} color="text-blue-700" />
                        <StatCard label="Total Population" value={stats.totalPopulation.toLocaleString()} icon={Users} color="text-indigo-700" />
                    </div>
                )}

                {/* Search */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by woreda, subcity..."
                            className="w-full pl-12 pr-5 py-3 bg-white rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-200 shadow-sm" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 px-2">{filtered.length} profiles</span>
                </div>

                {/* Profile Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading profiles…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                            <MapPin size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No profiles found</p>
                        <p className="text-slate-400 text-sm">Create your first Woreda Profile to get started</p>
                        <button onClick={() => { setEditProfile(null); setShowForm(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold mt-2">
                            <Plus size={16} /> Create Profile
                        </button>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map(p => (
                                <ProfileCard key={p._id} profile={p}
                                    onView={() => setViewProfile(p)}
                                    onEdit={() => { setEditProfile(p); setShowForm(true); }}
                                    onDelete={() => handleDelete(p._id)} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <FormWizard initial={editProfile} onSave={handleSave} onClose={() => { setShowForm(false); setEditProfile(null); }} saving={saving} />
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} importing={importing} />
                )}
                {showSync && (
                    <SyncInterviewModal 
                        onClose={() => setShowSync(false)}
                        onSync={handleSync}
                        mappings={mappings}
                        syncing={saving}
                    />
                )}
                {syncPreviewData && (
                    <SyncPreviewModal 
                        data={syncPreviewData} 
                        onClose={() => setSyncPreviewData(null)} 
                        onConfirm={() => handleSync({ ...syncPreviewData.requestData, dryRun: false })}
                        syncing={saving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default WoredaProfile;
