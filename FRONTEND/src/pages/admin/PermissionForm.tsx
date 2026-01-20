import React, { useState, useEffect } from 'react';
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Permission } from '../../api/permissionService';

interface PermissionFormProps {
    initialData?: Permission | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        resource: '',
        action: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                resource: initialData.resource,
                action: initialData.action
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Error submitting form", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <Label>Permission Name</Label>
                <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Create User"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Resource</Label>
                    <Input
                        type="text"
                        name="resource"
                        value={formData.resource}
                        onChange={handleChange}
                        required
                        placeholder="e.g. user"
                    />
                </div>
                <div>
                    <Label>Action</Label>
                    <Input
                        type="text"
                        name="action"
                        value={formData.action}
                        onChange={handleChange}
                        required
                        placeholder="e.g. create"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 mt-4 justify-end">
                <Button size="sm" variant="outline" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button size="sm" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
};
