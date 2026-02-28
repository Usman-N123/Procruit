import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/UI';
import { Users, Building, Plus, Settings } from 'lucide-react';
import { apiRequest } from '../utils/api';

export const OrgAdminDashboard: React.FC = () => {
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalRecruiters: 0, activeJobs: 0 }); // Placeholder stats
    const [showAddRecruiter, setShowAddRecruiter] = useState(false);
    const [newRecruiter, setNewRecruiter] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        fetchRecruiters();
    }, []);

    const fetchRecruiters = () => {
        apiRequest('/auth/recruiters')
            .then(data => {
                setRecruiters(data);
                setStats(prev => ({ ...prev, totalRecruiters: data.length }));
            })
            .catch(console.error);
    };

    const handleAddRecruiter = async () => {
        try {
            await apiRequest('/auth/register-recruiter', 'POST', newRecruiter);
            alert('Recruiter added successfully');
            setShowAddRecruiter(false);
            setNewRecruiter({ name: '', email: '', password: '' });
            fetchRecruiters();
        } catch (error) {
            alert('Failed to add recruiter');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Organization Dashboard</h1>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-[#7B2CBF]/20 rounded-lg text-[#7B2CBF]">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-neutral-400 text-sm">Total Recruiters</p>
                        <h3 className="text-2xl font-bold">{stats.totalRecruiters}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-neutral-400 text-sm">Company Profile</p>
                        <h3 className="text-lg font-bold">Active</h3>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Team Management</h2>
                    <Button icon={Plus} onClick={() => setShowAddRecruiter(true)}>Add Recruiter</Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recruiters.map(rec => (
                        <Card key={rec._id} className="flex items-center gap-4 p-4">
                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-bold">
                                {rec.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold">{rec.name}</h4>
                                <p className="text-sm text-neutral-400">{rec.email}</p>
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 mt-1 inline-block">Active</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <Modal isOpen={showAddRecruiter} onClose={() => setShowAddRecruiter(false)} title="Add New Recruiter">
                <div className="space-y-4">
                    <Input label="Full Name" value={newRecruiter.name} onChange={e => setNewRecruiter({ ...newRecruiter, name: e.target.value })} />
                    <Input label="Email Address" type="email" value={newRecruiter.email} onChange={e => setNewRecruiter({ ...newRecruiter, email: e.target.value })} />
                    <Input label="Password" type="password" value={newRecruiter.password} onChange={e => setNewRecruiter({ ...newRecruiter, password: e.target.value })} />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setShowAddRecruiter(false)}>Cancel</Button>
                        <Button onClick={handleAddRecruiter}>Create Account</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

import { ChangePasswordForm } from '../components/ChangePasswordForm';

export const OrgSettings: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Organization Settings</h2>
            <ChangePasswordForm />
        </div>
    );
};
