
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { Video, Calendar, DollarSign, Clock, User, Briefcase, Star, Upload, MessageSquare } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { User as UserType, Interview, Message } from '../types';
import InterviewsTab from '../components/InterviewsTab';

const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const InterviewerDashboard: React.FC = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then(setUser).catch(console.error);
        apiRequest('/interviews/my-interviews')
            .then(data => {
                console.log('Interviewer my-interviews fetched:', data);
                setInterviews(data);
            })
            .catch(console.error);
        apiRequest('/interviews/my-messages').then(setMessages).catch(console.error);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Interviewer Dashboard</h2>
                    <p className="text-neutral-400">Welcome back, {user?.firstName}. Manage your sessions.</p>
                </div>
                <div className="flex gap-3">
                    <Badge variant="success">Available</Badge>
                    <span className="text-sm text-neutral-400 self-center">Rate: {user?.hourlyRate || '$0'}/hr</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-purple-900/10 border-l-4 border-l-[#7B2CBF]">
                    <h3 className="text-3xl font-bold mb-1">{interviews.length}</h3>
                    <p className="text-neutral-400">Total Sessions</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-green-900/10 border-l-4 border-l-green-500">
                    <h3 className="text-3xl font-bold mb-1">${(interviews.filter(i => i.status === 'Completed').length * parseFloat(user?.hourlyRate?.toString() || '0')).toFixed(0)}</h3>
                    <p className="text-neutral-400">Total Earnings</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-blue-900/10 border-l-4 border-l-blue-500">
                    <h3 className="text-3xl font-bold mb-1">5.0</h3>
                    <p className="text-neutral-400">Average Rating</p>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card title="Upcoming Schedule">
                    {interviews.filter(i => i.status === 'Scheduled').length === 0 ? <p className="text-neutral-500">No interviews scheduled.</p> : (
                        <div className="space-y-4">
                            {interviews.filter(i => i.status === 'Scheduled').map(inv => (
                                <div key={inv._id} className="p-4 bg-neutral-800 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white flex items-center gap-2"><Video size={16} className="text-[#7B2CBF]" /> Interview</p>
                                        <p className="text-xs text-neutral-400">
                                            {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleString() : `${inv.date} at ${inv.time}`}
                                        </p>
                                    </div>
                                    <a href={`#/interview/room/${inv.meetingId}`} className="text-xs bg-[#7B2CBF] px-3 py-1 rounded text-white hover:bg-[#9D4EDD]">Join Room</a>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Booking Requests">
                    {interviews.filter(i => i.status === 'Pending').length === 0 ? <p className="text-neutral-500">No pending booking requests.</p> : (
                        <div className="space-y-3">
                            {interviews.filter(i => i.status === 'Pending').map(inv => (
                                <div key={inv._id} className="p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                                    <div className="mb-3">
                                        <p className="font-semibold text-white flex gap-2 items-center">
                                            <Calendar size={16} className="text-[#7B2CBF]" />
                                            {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleString() : 'Unknown Time'}
                                        </p>
                                        <p className="text-sm text-neutral-400 mt-1">
                                            Requested by: <span className="font-medium text-white">{(inv.recruiterId as any)?.name}</span>
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            For Candidate: <span className="font-medium text-white">{(inv.candidateId as any)?.name}</span>
                                        </p>
                                        {inv.notes && (
                                            <div className="mt-2 p-2 bg-neutral-800 rounded text-xs text-neutral-300">
                                                <span className="text-neutral-500 font-semibold">Notes:</span> {inv.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    await apiRequest(`/interviews/${inv._id}/status`, 'PATCH', { status: 'Accepted' });
                                                    alert("Interview accepted!");
                                                    // Refresh list
                                                    apiRequest('/interviews/my-interviews').then(setInterviews);
                                                } catch (e) { alert("Failed to accept"); }
                                            }}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-900/50 text-red-500 hover:bg-red-900/20"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    await apiRequest(`/interviews/${inv._id}/status`, 'PATCH', { status: 'Rejected' });
                                                    alert("Interview rejected");
                                                    // Refresh list
                                                    apiRequest('/interviews/my-interviews').then(setInterviews);
                                                } catch (e) { alert("Failed to reject"); }
                                            }}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export const InterviewerProfile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', headline: '', bio: '', skills: '', hourlyRate: '', yearsOfExperience: '', availability: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then((data) => {
            setUser(data);
            setProfilePicture(data.profilePicture);
            setFormData({
                firstName: data.firstName || data.name.split(' ')[0] || '',
                lastName: data.lastName || data.name.split(' ').slice(1).join(' ') || '',
                headline: data.profile?.headline || '',
                bio: data.profile?.bio || '',
                skills: data.profile?.skills ? data.profile.skills.join(', ') : '',
                hourlyRate: data.profile?.hourlyRate || '',
                yearsOfExperience: data.profile?.yearsOfExperience || '',
                availability: data.profile?.availability ? data.profile.availability.join(', ') : ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const availabilityArray = formData.availability.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await apiRequest('/users/profile', 'PUT', {
                ...formData,
                skills: skillsArray,
                availability: availabilityArray,
                hourlyRate: parseFloat(formData.hourlyRate) || 0
            });
            alert('Profile updated!');
        } catch (e) { alert('Error updating profile'); }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const formData = new FormData();
                formData.append('profilePicture', e.target.files[0]);

                const response = await apiRequest('/users/profile-picture', 'POST', formData);
                setProfilePicture(response.profilePicture);
                alert('Photo updated');
            } catch (err: any) {
                alert(`Error uploading image: ${err.message || 'Unknown error'}`);
            }
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Interviewer Profile</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 text-center p-6 h-fit">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <img src={profilePicture || "/assets/default-avatar.png"} className="w-full h-full rounded-full object-cover border-4 border-[#7B2CBF]" alt="Profile" />
                        <label className="absolute bottom-0 right-0 p-2 bg-neutral-800 rounded-full border border-neutral-700 hover:bg-neutral-700 transition-colors cursor-pointer">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                        </label>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4">Freelance Interviewer</p>
                    <Badge variant="info">{formData.hourlyRate || '0'}/hr</Badge>
                </Card>

                <Card className="md:col-span-2 p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                            <User size={20} className="text-[#7B2CBF]" /> Personal
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                            <Briefcase size={20} className="text-[#7B2CBF]" /> Expertise
                        </h3>
                        <div className="space-y-4">
                            <Input label="Professional Headline" placeholder="e.g. Senior System Design Interviewer" value={formData.headline} onChange={e => setFormData({ ...formData, headline: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Bio / Expertise</label>
                                <textarea className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-24 focus:border-[#7B2CBF] outline-none"
                                    placeholder="Describe your technical expertise..."
                                    value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <Input label="Skills (Comma separated)" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                            <DollarSign size={20} className="text-[#7B2CBF]" /> Rates & Availability
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Hourly Rate ($)" placeholder="50" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: e.target.value.replace(/[^0-9]/g, '') })} />
                            <Input label="Years of Exp" placeholder="5" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })} />
                            <Input label="Availability (Comma separated)" placeholder="Weekends, Evenings" value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const InterviewerInterviews: React.FC = () => {
    return <InterviewsTab role="INTERVIEWER" />;
};

export const InterviewerRequests: React.FC = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);

    useEffect(() => {
        const fetchRequests = () => {
            apiRequest('/interviews/my-interviews')
                .then(data => setInterviews(data))
                .catch(console.error);
        };
        fetchRequests();
    }, []);

    const pendingRequests = interviews.filter(i => i.status === 'Pending');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Booking Requests</h2>
            <p className="text-neutral-400">Review and respond to incoming interview requests from recruiters.</p>

            {pendingRequests.length === 0 ? (
                <Card className="text-center py-12">
                    <Calendar size={48} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 text-lg">No pending booking requests at this time.</p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.map(inv => (
                        <Card key={inv._id} className="flex flex-col h-full border hover:border-[#7B2CBF]/30 transition-all">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant="warning">Pending Request</Badge>
                                    <span className="text-xs text-neutral-500">{new Date(inv.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-white mb-1">
                                        For: {(inv.candidateId as any)?.name || 'Unknown Candidate'}
                                    </h3>
                                    <p className="text-sm text-neutral-400 flex items-center gap-2">
                                        <Briefcase size={14} className="text-[#7B2CBF]" />
                                        Requested by: {(inv.recruiterId as any)?.name || 'Unknown Recruiter'}
                                    </p>
                                </div>

                                <div className="p-3 bg-neutral-900 rounded-lg space-y-2">
                                    <p className="text-sm text-white flex items-center gap-2 font-medium">
                                        <Calendar size={14} className="text-[#7B2CBF]" />
                                        {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleDateString() : 'TBD Date'}
                                    </p>
                                    <p className="text-sm text-white flex items-center gap-2 font-medium">
                                        <Clock size={14} className="text-[#7B2CBF]" />
                                        {inv.scheduledTime ? new Date(inv.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD Time'}
                                    </p>
                                </div>

                                {inv.notes && (
                                    <div className="text-sm text-neutral-300 bg-neutral-800/50 p-3 rounded-lg border border-neutral-700">
                                        <span className="text-[#7B2CBF] font-semibold block mb-1">Notes from Recruiter:</span>
                                        {inv.notes}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-800">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={async () => {
                                        try {
                                            await apiRequest(`/interviews/${inv._id}/status`, 'PATCH', { status: 'Accepted' });
                                            alert("Interview accepted!");
                                            apiRequest('/interviews/my-interviews').then(setInterviews);
                                        } catch (e) { alert("Failed to accept"); }
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                                    onClick={async () => {
                                        try {
                                            await apiRequest(`/interviews/${inv._id}/status`, 'PATCH', { status: 'Rejected' });
                                            alert("Interview rejected");
                                            apiRequest('/interviews/my-interviews').then(setInterviews);
                                        } catch (e) { alert("Failed to reject"); }
                                    }}
                                >
                                    Decline
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
