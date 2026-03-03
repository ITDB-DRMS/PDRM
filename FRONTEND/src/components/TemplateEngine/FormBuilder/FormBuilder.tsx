import React, { useState } from 'react';
import { FormBuilderProvider, useFormBuilder, Question } from '../../../context/FormBuilderContext';
import ModuleBuilder from './ModuleBuilder';
import QuestionEditor from './QuestionEditor';
import QuestionTypeSelector from './QuestionTypeSelector';
import { FIELD_TYPES } from './QuestionTypeSelector';
import {
    Send, Save, Eye, ChevronLeft,
    Smartphone, Monitor, Tablet, Download, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import api from '@/api/axios';
import { clsx } from 'clsx';

// ─── Schema Converter ────────────────────────────────────────────────────────
// Converts the FormBuilder's flat-question schema into the backend's
// modules → sections → fields schema expected by the Template model.
const convertToBackendSchema = (template: any) => {
    return template.modules.map((module: any, mIdx: number) => ({
        moduleId: module.moduleId,
        title: module.moduleName,
        order: mIdx,
        sections: [
            {
                sectionId: `${module.moduleId}_section`,
                title: module.moduleName,
                description: '',
                fields: module.questions.map((q: Question): any => ({
                    fieldId: q.questionId,
                    questionCode: q.questionCode,
                    label: q.label,
                    type: q.answerType,
                    helpText: q.helperText,
                    required: q.required,
                    options: q.options?.map((o: any) => ({
                        label: o.label,
                        value: o.value
                    })) || [],
                    matrixConfig: q.answerType === 'matrix' ? q.matrixConfig : undefined,
                    validation: q.validation || {},
                    permissions: { visibleToRoles: [], editableByRoles: [] }
                }))
            }
        ]
    }));
};

// ─── Form Preview Modal ───────────────────────────────────────────────────────
const PreviewModal: React.FC<{ template: any; onClose: () => void }> = ({ template, onClose }) => {
    const [radioValues, setRadioValues] = useState<Record<string, string>>({});
    const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>({});

    const allQuestions = template.modules.flatMap((m: any) => m.questions);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                <header className="p-6 border-b flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">📋 Preview: {template.templateName}</h2>
                        <p className="text-xs text-gray-400 mt-1">This is how respondents will see your questionnaire</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {template.modules.map((module: any) => (
                        <div key={module.moduleId}>
                            <h3 className="text-lg font-black text-gray-900 mb-6 pb-3 border-b-2 border-gray-100">{module.moduleName}</h3>
                            <div className="space-y-8">
                                {module.questions.map((q: Question, idx: number) => (
                                    <div key={q.questionId} className="space-y-3">
                                        {q.answerType === 'header' ? (
                                            <h4 className="text-base font-black text-gray-700 uppercase tracking-wide border-b border-dashed pb-2">{q.label}</h4>
                                        ) : q.answerType === 'note' ? (
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 italic">{q.label}</div>
                                        ) : (
                                            <>
                                                <label className="block text-sm font-bold text-gray-900">
                                                    <span className="text-blue-600 font-black mr-2">{q.questionCode}.</span>
                                                    {q.label}
                                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                {q.helperText && (
                                                    <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg">{q.helperText}</p>
                                                )}

                                                {/* Render input by type */}
                                                {['text', 'email', 'phone'].includes(q.answerType) && (
                                                    <input type="text" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder={q.validation?.placeholder as string || ''} />
                                                )}
                                                {q.answerType === 'textarea' && (
                                                    <textarea className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]" placeholder={q.validation?.placeholder as string || ''} />
                                                )}
                                                {q.answerType === 'number' && (
                                                    <input type="number" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                                                )}
                                                {q.answerType === 'date' && (
                                                    <input type="date" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                                                )}
                                                {q.answerType === 'radio' && (
                                                    <div className="space-y-2">
                                                        {q.options?.map((opt, oi) => (
                                                            <label key={oi} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-blue-50 cursor-pointer transition-all">
                                                                <input
                                                                    type="radio"
                                                                    name={q.questionId}
                                                                    value={opt.value}
                                                                    checked={radioValues[q.questionId] === opt.value}
                                                                    onChange={() => setRadioValues(prev => ({ ...prev, [q.questionId]: opt.value }))}
                                                                    className="text-blue-600"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                                                                {opt.hasAdditionalInput && radioValues[q.questionId] === opt.value && (
                                                                    <input type="text" className="flex-1 border-b border-dashed border-blue-300 outline-none text-sm px-2 py-1" placeholder={opt.additionalInput?.label || 'Please specify'} />
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.answerType === 'checkbox' && (
                                                    <div className="space-y-2">
                                                        {q.options?.map((opt, oi) => {
                                                            const checked = checkboxValues[q.questionId]?.includes(opt.value) || false;
                                                            return (
                                                                <label key={oi} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-blue-50 cursor-pointer transition-all">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => setCheckboxValues(prev => ({
                                                                            ...prev,
                                                                            [q.questionId]: checked
                                                                                ? (prev[q.questionId] || []).filter(v => v !== opt.value)
                                                                                : [...(prev[q.questionId] || []), opt.value]
                                                                        }))}
                                                                        className="rounded text-blue-600"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                                                                    {opt.hasAdditionalInput && checked && (
                                                                        <input type="text" className="flex-1 border-b border-dashed border-blue-300 outline-none text-sm px-2 py-1" placeholder={opt.additionalInput?.label || 'Please specify'} />
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {q.answerType === 'matrix' && q.matrixConfig && (
                                                    <div className="overflow-x-auto rounded-2xl border">
                                                        <table className="min-w-full text-xs">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="p-3 text-left text-gray-400 font-black uppercase">—</th>
                                                                    {q.matrixConfig.columns.map((col: any, ci: number) => (
                                                                        <th key={ci} className="p-3 text-center text-gray-600 font-bold">{col.label}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {q.matrixConfig.rows.map((row: any, ri: number) => (
                                                                    <tr key={ri} className="border-t">
                                                                        <td className="p-3 font-bold text-gray-700">{row.label}</td>
                                                                        {q.matrixConfig.columns.map((_: any, ci: number) => (
                                                                            <td key={ci} className="p-3 text-center">
                                                                                <input type={q.matrixConfig.cellType === 'radio' ? 'radio' : 'checkbox'} name={`${q.questionId}_r${ri}`} className="accent-blue-600" />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="p-6 border-t bg-gray-50/50 rounded-b-3xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                        Close Preview
                    </button>
                </footer>
            </div>
        </div>
    );
};

// ─── Inner Form Builder ───────────────────────────────────────────────────────
const InnerFormBuilder: React.FC = () => {
    const { state, dispatch } = useFormBuilder();
    const navigate = useNavigate();
    const [showPreview, setShowPreview] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const buildPayload = (status: 'Draft' | 'Published') => ({
        name: state.template.templateName,
        category: 'Household',
        moduleType: 'QNR',
        description: '',
        status,
        modules: convertToBackendSchema(state.template)
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let response;
            if (savedId) {
                response = await api.put(`/templates/${savedId}`, buildPayload('Draft'));
                toast.success('Draft updated successfully!');
            } else {
                response = await api.post('/templates', buildPayload('Draft'));
                setSavedId(response.data._id);
                toast.success('Draft saved successfully!');
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Failed to save draft';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            let id = savedId;
            // If never saved, create a draft first
            if (!id) {
                const draftRes = await api.post('/templates', buildPayload('Draft'));
                id = draftRes.data._id;
                setSavedId(id);
            }
            // Then publish
            await api.post(`/templates/${id}/publish`);
            toast.success('🚀 Template published successfully!');
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Failed to publish';
            toast.error(msg);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* 🏆 Top Navigation */}
            <nav className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-30 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/admin/template-library')}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                        title="Back to Template Library"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="h-8 w-[1px] bg-gray-100" />
                    <div>
                        <input
                            type="text"
                            value={state.template.templateName}
                            onChange={(e) => dispatch({ type: 'SET_TEMPLATE_NAME', name: e.target.value })}
                            className="text-lg font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Architect Engine v4.0</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Device Switcher */}
                    <div className="hidden lg:flex bg-gray-100 p-1 rounded-xl">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Smartphone size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Tablet size={18} /></button>
                        <button className="p-2 bg-white text-blue-600 rounded-lg shadow-sm"><Monitor size={18} /></button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* ✅ Working Preview Button */}
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <Eye size={18} /> Preview
                        </button>

                        {/* ✅ Working Save Draft Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all",
                                isSaving && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>

                        {/* ✅ Working Publish Button */}
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-2.5 text-sm font-black text-white bg-gray-900 hover:bg-black rounded-xl shadow-xl shadow-gray-200 transition-all uppercase tracking-widest",
                                isPublishing && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {isPublishing ? 'Publishing...' : 'Publish'} <Send size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 🏗 Main Workspace */}
            <main className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto px-8 pt-12 pb-24 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Download size={80} />
                            </div>
                            <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Instrument Overview</h2>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                                Build your questionnaire structures <br />with semantic precision.
                            </h1>
                        </div>
                        <ModuleBuilder />
                    </div>
                </div>

                <QuestionEditor />
            </main>

            {/* Overlays */}
            <QuestionTypeSelector />
            {showPreview && <PreviewModal template={state.template} onClose={() => setShowPreview(false)} />}
        </div>
    );
};

// ─── Root Component ───────────────────────────────────────────────────────────
const FormBuilder: React.FC = () => {
    return (
        <FormBuilderProvider>
            <InnerFormBuilder />
        </FormBuilderProvider>
    );
};

export default FormBuilder;
