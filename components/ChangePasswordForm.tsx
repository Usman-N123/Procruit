import React, { useState } from 'react';
import { Card, Button, Input } from './UI';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/api';

export const ChangePasswordForm: React.FC = () => {
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);

    const toggleVisibility = (field: keyof typeof showPassword) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            alert('Please fill in all fields.');
            return;
        }

        if (passwords.new.length < 8) {
            alert('New password must be at least 8 characters long.');
            return;
        }

        if (passwords.new !== passwords.confirm) {
            alert('New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/auth/change-password', 'POST', {
                oldPassword: passwords.current,
                newPassword: passwords.new
            });
            alert('Password updated successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            alert(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Security Settings" className="max-w-xl">
            <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-200 text-sm">
                    <Shield size={20} className="text-orange-500" />
                    <p>Make sure your new password is strong and unique.</p>
                </div>

                <Input
                    label="Current Password"
                    type={showPassword.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    icon={Lock}
                    endIcon={showPassword.current ? EyeOff : Eye}
                    onEndIconClick={() => toggleVisibility('current')}
                />

                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label="New Password"
                        type={showPassword.new ? "text" : "password"}
                        placeholder="Min 8 chars"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        icon={Lock}
                        endIcon={showPassword.new ? EyeOff : Eye}
                        onEndIconClick={() => toggleVisibility('new')}
                    />
                    <Input
                        label="Confirm New Password"
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        icon={Lock}
                        endIcon={showPassword.confirm ? EyeOff : Eye}
                        onEndIconClick={() => toggleVisibility('confirm')}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
