import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { MapPin, Upload } from 'lucide-react';

interface FieldProps {
    field: any;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    setValue?: (name: string, value: any) => void;
    watch?: (name: string) => any;
}

export const TextField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            {...register(field.questionCode, { required: field.required })}
            placeholder={field.helpText}
            className={`w-full p-2.5 border rounded-lg outline-none transition-all ${errors[field.questionCode] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white'
                }`}
        />
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">{field.label} is required</p>
        )}
    </div>
);

export const RadioField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {field.options.map((opt: any) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border-gray-100">
                    <input
                        type="radio"
                        value={opt.value}
                        {...register(field.questionCode, { required: field.required })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
            ))}
        </div>
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">Please select an option</p>
        )}
    </div>
);

export const SelectField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <select
            {...register(field.questionCode, { required: field.required })}
            className={`w-full p-2.5 border rounded-lg outline-none transition-all ${errors[field.questionCode] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white'
                }`}
        >
            <option value="">Select an option</option>
            {(field.options || []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const MatrixField: React.FC<FieldProps> = ({ field, register }) => {
    const columns = field.options?.columns || [
        { label: 'Low', value: '1' },
        { label: 'Medium', value: '2' },
        { label: 'High', value: '3' }
    ];
    const rows = field.options?.rows || [
        { label: 'Frequency', value: 'freq' },
        { label: 'Severity', value: 'sev' }
    ];

    return (
        <div className="space-y-3 overflow-x-auto">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 p-3 text-left">Category</th>
                        {columns.map((col: any) => (
                            <th key={col.value} className="border border-gray-200 p-3 text-center">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any) => (
                        <tr key={row.value} className="hover:bg-gray-50">
                            <td className="border border-gray-200 p-3 font-medium text-gray-600">{row.label}</td>
                            {columns.map((col: any) => (
                                <td key={col.value} className="border border-gray-200 p-3 text-center">
                                    <input
                                        type="radio"
                                        value={col.value}
                                        {...register(`${field.questionCode}.${row.value}`, { required: field.required })}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const TableField: React.FC<FieldProps> = ({ field, register }) => {
    const columns = field.options?.columns || [{ label: 'Name', value: 'name', type: 'text' }];

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {columns.map((col: any) => (
                                <th key={col.value} className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {[0, 1, 2].map((rowIdx) => (
                            <tr key={rowIdx}>
                                {columns.map((col: any) => (
                                    <td key={col.value} className="p-2">
                                        <input
                                            type={col.type || 'text'}
                                            {...register(`${field.questionCode}.${rowIdx}.${col.value}`)}
                                            className="w-full p-2 border border-transparent focus:border-blue-300 rounded outline-none transition-all placeholder:text-gray-300"
                                            placeholder="Enter value..."
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const GeoField: React.FC<FieldProps> = ({ field, register, setValue, watch }) => {
    const value = watch?.(field.questionCode);

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setValue?.(field.questionCode, {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: new Date().toISOString()
                });
            });
        }
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 flex items-center gap-3">
                    <MapPin size={18} className="text-blue-500" />
                    {value ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : 'No location captured'}
                </div>
                <button
                    type="button"
                    onClick={handleGetLocation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    Capture
                </button>
            </div>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};

export const FileField: React.FC<FieldProps> = ({ field, register }) => (
    <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 hover:border-blue-400 cursor-pointer transition-all group">
            <Upload className="text-gray-400 group-hover:text-blue-500 mb-2" size={32} />
            <span className="text-sm text-gray-500 font-medium">Click or drag and drop to upload</span>
            <span className="text-xs text-gray-400 mt-1">Maximum file size: 5MB</span>
            <input type="file" className="hidden" {...register(field.questionCode, { required: field.required })} />
        </label>
    </div>
);
