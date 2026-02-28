
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { Video, Calendar, DollarSign, Clock, User, Briefcase, Star, Upload, MessageSquare } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { User as UserType, Interview, Message } from '../types';

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
        apiRequest('/interviews/my-interviews').then(setInterviews).catch(console.error);
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
                    <p className="text-neutral-400">Upcoming Sessions</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-green-900/10 border-l-4 border-l-green-500">
                    <h3 className="text-3xl font-bold mb-1">${(interviews.length * parseFloat(user?.hourlyRate?.replace('$', '') || '0')).toFixed(0)}</h3>
                    <p className="text-neutral-400">Estimated Earnings</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-blue-900/10 border-l-4 border-l-blue-500">
                    <h3 className="text-3xl font-bold mb-1">5.0</h3>
                    <p className="text-neutral-400">Average Rating</p>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card title="Upcoming Schedule">
                    {interviews.length === 0 ? <p className="text-neutral-500">No interviews scheduled.</p> : (
                        <div className="space-y-4">
                            {interviews.map(inv => (
                                <div key={inv._id} className="p-4 bg-neutral-800 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white flex items-center gap-2"><Video size={16} className="text-[#7B2CBF]" /> Interview</p>
                                        <p className="text-xs text-neutral-400">{inv.date} at {inv.time}</p>
                                    </div>
                                    <a href={inv.meetingLink} target="_blank" className="text-xs bg-[#7B2CBF] px-3 py-1 rounded text-white hover:bg-[#9D4EDD]">Join</a>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Recent Requests (Messages)">
                    {messages.length === 0 ? <p className="text-neutral-500">No new messages.</p> : (
                        <div className="space-y-3">
                            {messages.map(msg => (
                                <div key={msg._id} className="p-3 border border-neutral-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageSquare size={14} className="text-neutral-500" />
                                        <span className="font-semibold text-xs">{(msg.senderId as any)?.name}</span>
                                    </div>
                                    <p className="text-sm text-neutral-300 line-clamp-2">{msg.content}</p>
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
                headline: data.headline || '',
                bio: data.bio || '',
                skills: data.skills ? data.skills.join(', ') : '',
                hourlyRate: data.hourlyRate || '',
                yearsOfExperience: data.yearsOfExperience || '',
                availability: data.availability || ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await apiRequest('/users/profile', 'PUT', { ...formData, skills: skillsArray });
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
                    <Badge variant="info">{formData.hourlyRate || '$0'}/hr</Badge>
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
                            <Input label="Hourly Rate ($)" placeholder="$50" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })} />
                            <Input label="Years of Exp" placeholder="5" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })} />
                            <Input label="Availability" placeholder="Weekends" value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} />
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
