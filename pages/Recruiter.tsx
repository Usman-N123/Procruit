import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import { Plus, Search, Calendar, Clock, Video, FileText, ChevronRight, BarChart2, User, MapPin, Briefcase, GraduationCap, Github, Linkedin, Globe, Upload, Lock, Shield, MessageSquare, Link as LinkIcon, Download, Star, DollarSign } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Job, User as UserType } from '../types';
import InterviewsTab from '../components/InterviewsTab';

// Helper to convert file to base64
const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

import { ApplicantReviewModal } from '../components/ApplicantReviewModal';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

export const RecruiterDashboard: React.FC = () => {
    const [stats, setStats] = useState({ jobs: 0, applicants: 0, interviews: 0, pipeline: { Applied: 0, Screening: 0, Interview: 0, Offer: 0, Rejected: 0 } });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jobs = await apiRequest('/jobs/my-jobs');
                const interviews = await apiRequest('/interviews/my-interviews');
                const applications = await apiRequest('/jobs/applications/received');

                const pipelineCounts = { Applied: 0, Screening: 0, Interview: 0, Offer: 0, Rejected: 0 };
                applications.forEach((app: any) => {
                    if (pipelineCounts[app.status as keyof typeof pipelineCounts] !== undefined) {
                        pipelineCounts[app.status as keyof typeof pipelineCounts]++;
                    }
                });

                setStats({
                    jobs: jobs.length,
                    applicants: applications.length,
                    interviews: interviews.length,
                    pipeline: pipelineCounts
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Recruiter Dashboard</h2>
                    <p className="text-neutral-400">Welcome back, here's what's happening today.</p>
                </div>
                <Button icon={Plus} onClick={() => window.location.href = '#/recruiter/jobs'}>Post New Job</Button>
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-purple-900/10 border-l-4 border-l-[#7B2CBF]">
                    <h3 className="text-3xl font-bold mb-1">{stats.jobs}</h3>
                    <p className="text-neutral-400">Active Job Postings</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-blue-900/10 border-l-4 border-l-blue-500">
                    <h3 className="text-3xl font-bold mb-1">{stats.applicants}</h3>
                    <p className="text-neutral-400">Total Applicants</p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-neutral-900 to-green-900/10 border-l-4 border-l-green-500">
                    <h3 className="text-3xl font-bold mb-1">{stats.interviews}</h3>
                    <p className="text-neutral-400">Scheduled Interviews</p>
                </Card>
            </div>

            {/* Pipeline Health */}
            <Card title="Application Pipeline">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(stats.pipeline).map(([status, count]) => (
                        <div key={status} className="p-4 bg-neutral-800/50 rounded-lg text-center border border-neutral-800">
                            <h4 className="text-2xl font-bold text-white mb-1">{count}</h4>
                            <p className="text-xs text-neutral-400 uppercase tracking-wider">{status}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
                <Card title="Quick Actions">
                    <div className="space-y-4">
                        <Button className="w-full justify-start" icon={Search} variant="ghost" onClick={() => window.location.href = '#/recruiter/applicants'}>Find Candidates</Button>
                        <Button className="w-full justify-start" icon={Video} variant="ghost" onClick={() => window.location.href = '#/recruiter/hire-interviewer'}>Hire Freelance Interviewer</Button>
                        <Button className="w-full justify-start" icon={Plus} variant="ghost" onClick={() => window.location.href = '#/recruiter/jobs'}>Create New Job Post</Button>
                        <Button className="w-full justify-start" icon={User} variant="ghost" onClick={() => window.location.href = '#/recruiter/profile'}>Update Profile</Button>
                    </div>
                </Card>
                <Card title="Recent Applicants">
                    <div className="space-y-4">
                        <div className="p-4 text-neutral-500 text-center text-sm">Check the 'Applicants' tab to manage candidates.</div>
                        <Button variant="ghost" className="w-full mt-2 text-sm" onClick={() => window.location.href = '#/recruiter/applicants'}>View All Applicants</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const MyJobs: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/jobs/my-jobs').then(setJobs).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading jobs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Job Postings</h2>
                <Button icon={Plus} onClick={() => window.location.href = '#/recruiter/jobs'}>Post New Job</Button>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900 rounded-xl border border-neutral-800">
                    <p className="text-neutral-400 mb-4">You haven't posted any jobs yet.</p>
                    <Button onClick={() => window.location.href = '#/recruiter/jobs'}>Create First Job</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <Card key={job._id} className="flex justify-between items-center p-6 group hover:border-[#7B2CBF]">
                            <div>
                                <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                                <div className="flex gap-4 text-sm text-neutral-400">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><User size={14} /> {job.applicants?.length || 0} Applicants</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={job.status === 'Active' ? 'neutral' : 'outline'} className={job.status === 'Active' ? 'text-green-400 border-green-900' : 'text-neutral-500'}>
                                    {job.status}
                                </Badge>
                                <Button variant="outline" size="sm" onClick={() => window.location.href = `#/recruiter/applicants?jobId=${job._id}`}>View Applicants</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CreateJob: React.FC = () => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        salary: '',
        company: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch user profile to get company name
        apiRequest('/users/profile').then(user => {
            const orgName = user.organization?.name || user.companyName;
            if (orgName) {
                setFormData(prev => ({ ...prev, company: orgName }));
            }
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!formData.title || !formData.location || !formData.company) {
            alert("Please fill in all required fields (and ensure your profile has a Company Name)");
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/jobs', 'POST', formData);
            alert('Job posted successfully!');
            setFormData({ title: '', location: '', type: 'Full-time', description: '', requirements: '', salary: '', company: formData.company });
        } catch (err) {
            alert('Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Job Post</h2>
            <Card className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Senior Product Designer"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Company Name"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Location"
                        placeholder="e.g. Remote / New York"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Employment Type</label>
                        <select
                            className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#7B2CBF]"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Full-time</option>
                            <option>Contract</option>
                            <option>Part-time</option>
                            <option>Remote</option>
                        </select>
                    </div>
                </div>
                <Input
                    label="Salary Range"
                    placeholder="e.g. $100k - $120k"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                />
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Job Description</label>
                    <textarea
                        className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-32 focus:border-[#7B2CBF] outline-none"
                        placeholder="Describe the role responsibilities..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Requirements</label>
                    <textarea
                        className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-32 focus:border-[#7B2CBF] outline-none"
                        placeholder="List skills and requirements..."
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Posting...' : 'Publish Job'}</Button>
                </div>
            </Card>
        </div>
    )
}


export const Applicants: React.FC = () => {
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);

    // Modal Forms
    const [scheduleData, setScheduleData] = useState({ date: '', time: '', link: '' });
    const [messageData, setMessageData] = useState({ content: '' });

    const fetchApplications = async () => {
        try {
            const data = await apiRequest('/jobs/applications/received');
            setApplications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await apiRequest(`/jobs/applications/${id}/status`, 'PUT', { status });
            // Update local state
            setApplications(applications.map(app => app._id === id ? { ...app, status } : app));
            if (selectedApp && selectedApp._id === id) {
                setSelectedApp({ ...selectedApp, status });
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleSchedule = async () => {
        if (!selectedApp) return;
        try {
            await apiRequest('/interviews/schedule', 'POST', {
                candidateId: selectedApp.candidate._id,
                date: scheduleData.date,
                time: scheduleData.time,
                meetingLink: scheduleData.link
            });
            alert('Interview scheduled!');
            await handleStatusUpdate(selectedApp._id, 'Interview');
            setIsScheduleOpen(false);
        } catch (error) {
            alert('Failed to schedule');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedApp) return;
        try {
            await apiRequest('/interviews/message', 'POST', {
                receiverId: selectedApp.candidate._id,
                content: messageData.content
            });
            alert('Message sent!');
            setIsMessageOpen(false);
        } catch (error) {
            alert('Failed to send message');
        }
    };

    // Helper to get consistent data (Snapshot vs Live Profile)
    const getCandidateData = (app: any) => {
        const profile = app.candidate.profile || {};
        return {
            name: app.candidate.name,
            profilePicture: app.candidate.profilePicture,
            headline: profile.headline || app.candidate.headline || 'Candidate',
            bio: profile.bio,
            skills: app.skills?.length > 0 ? app.skills : (profile.skills || app.candidate.skills || []),
            experience: app.experience?.length > 0 ? app.experience : (profile.experience || app.candidate.experience || []),
            education: app.education?.length > 0 ? app.education : (profile.education || app.candidate.education || []),
            resume: app.resume || profile.resume || app.candidate.resumeUrl
        };
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Applicants</h2>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-500 w-5 h-5" />
                    <Input placeholder="Search candidates..." className="pl-10" />
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.length === 0 && <p className="text-neutral-500 col-span-3">No applicants found yet.</p>}
                    {applications.map((app) => {
                        const data = getCandidateData(app);
                        return (
                            <Card key={app._id} className="flex flex-col gap-4 group hover:border-[#7B2CBF]/50 cursor-pointer relative" onClick={() => setSelectedApp(app)}>
                                <div className="absolute top-4 right-4">
                                    <Badge variant={app.status === 'Applied' ? 'neutral' : app.status === 'Rejected' ? 'outline' : 'neutral'} className={app.status === 'Rejected' ? 'text-red-400 border-red-900' : 'text-[#7B2CBF]'}>
                                        {app.status}
                                    </Badge>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <img src={data.profilePicture || "/assets/default-avatar.png"} className="w-12 h-12 rounded-lg object-cover" alt="profile" />
                                        <div>
                                            <h3 className="font-semibold text-white">{data.name}</h3>
                                            <p className="text-xs text-neutral-400">{data.headline}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-neutral-500">
                                    Applied for <span className="text-white font-medium">{app.job.title}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {data.skills?.slice(0, 3).map((s: string, idx: number) => (
                                        <span key={idx} className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300">{s}</span>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" className="w-full mt-auto" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(app);
                                }}>Review Application</Button>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Candidate Profile Modal */}
            <ApplicantReviewModal
                isOpen={selectedApp !== null}
                onClose={() => setSelectedApp(null)}
                application={selectedApp}
                onStatusUpdate={handleStatusUpdate}
                onSchedule={() => setIsScheduleOpen(true)}
                onMessage={() => setIsMessageOpen(true)}
            />

            {/* Schedule Interview Modal */}
            <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Interview">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={scheduleData.date} onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })} />
                        <Input label="Time" type="time" value={scheduleData.time} onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })} />
                    </div>
                    <Input label="Meeting Link" placeholder="https://zoom.us/j/..." value={scheduleData.link} onChange={e => setScheduleData({ ...scheduleData, link: e.target.value })} />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                        <Button onClick={handleSchedule}>Confirm Schedule</Button>
                    </div>
                </div>
            </Modal>

            {/* Send Message Modal */}
            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title="Send Message">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Message</label>
                        <textarea
                            className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-32 focus:border-[#7B2CBF] outline-none"
                            placeholder="Write your message here..."
                            value={messageData.content}
                            onChange={e => setMessageData({ ...messageData, content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendMessage}>Send Message</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export const FindInterviewers: React.FC = () => {
    const [interviewers, setInterviewers] = useState<UserType[]>([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState<UserType | null>(null);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');

    useEffect(() => {
        apiRequest('/users/interviewers').then(setInterviewers).catch(console.error);
    }, []);

    const handleHire = async () => {
        if (!selectedInterviewer) return;
        try {
            await apiRequest('/interviews/message', 'POST', {
                receiverId: selectedInterviewer._id,
                content: `Hi ${selectedInterviewer.name}, I would like to hire you for an interview session. \n\n${messageContent}`
            });
            alert('Request sent successfully!');
            setIsMessageOpen(false);
            setMessageContent('');
        } catch (error) {
            alert('Failed to send request');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Find Freelance Interviewers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interviewers.map(user => (
                    <Card key={user._id} className="flex flex-col gap-4 group hover:border-[#7B2CBF]/50">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicture || "/assets/default-avatar.png"} className="w-16 h-16 rounded-xl object-cover" alt="profile" />
                            <div>
                                <h3 className="font-bold text-white">{user.name}</h3>
                                <p className="text-xs text-[#7B2CBF]">{user.headline || 'Expert Interviewer'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-neutral-400">
                            <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-green-400" />
                                <span>{user.hourlyRate || '$50'}/hr</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-400" />
                                <span>{user.yearsOfExperience || '5+'} Years Experience</span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {user.skills?.slice(0, 3).map(s => (
                                <Badge key={s} variant="neutral">{s}</Badge>
                            ))}
                        </div>
                        <Button className="mt-auto" variant="outline" onClick={() => { setSelectedInterviewer(user); setIsMessageOpen(true); }}>
                            Contact / Hire
                        </Button>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} title={`Hire ${selectedInterviewer?.name}`}>
                <div className="space-y-4">
                    <p className="text-neutral-400 text-sm">Send a message to discuss availability and requirements.</p>
                    <textarea
                        className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-32 focus:border-[#7B2CBF] outline-none"
                        placeholder="Describe the job role and interview requirements..."
                        value={messageContent}
                        onChange={e => setMessageContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                        <Button onClick={handleHire}>Send Request</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export const RecruiterProfile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', companyName: '', website: '', companyDescription: ''
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        apiRequest('/users/profile').then((data) => {
            setUser(data);
            setProfilePicture(data.profilePicture);
            // Check if organization is populated (it should be for Recruiters/Admins)
            const org = data.organization || {};

            setFormData({
                firstName: data.firstName || data.name.split(' ')[0] || '',
                lastName: data.lastName || data.name.split(' ').slice(1).join(' ') || '',
                companyName: org.name || data.companyName || '',
                website: org.website || data.website || '',
                companyDescription: org.description || data.companyDescription || ''
            });
        }).catch(console.error);
    }, []);

    const handleSave = async () => {
        try {
            // Note: Only ADMINs can actually update organization fields based on backend logic
            await apiRequest('/users/profile', 'PUT', { ...formData });
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
                alert('Profile picture updated');
            } catch (err: any) {
                console.error(err);
                alert(`Error uploading image: ${err.message || 'Unknown error'}`);
            }
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Recruiter Profile</h2>
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
                    <p className="text-neutral-400 text-sm mb-4">Recruiter</p>
                </Card>

                <Card className="md:col-span-2 p-8 space-y-8">
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
                            <Briefcase size={20} className="text-[#7B2CBF]" /> Company
                        </h3>
                        <div className="space-y-4">
                            <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            <Input label="Website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Company Description</label>
                                <textarea className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-24 focus:border-[#7B2CBF] outline-none"
                                    value={formData.companyDescription} onChange={e => setFormData({ ...formData, companyDescription: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>

                    <div className="border-t border-neutral-800 pt-8 mt-8">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-[#7B2CBF]" /> Password & Security
                        </h3>
                        <ChangePasswordForm />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const RecruiterInterviews: React.FC = () => <InterviewsTab role="RECRUITER" />;
