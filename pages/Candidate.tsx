
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal } from '../components/UI';
import { MapPin, DollarSign, Clock, Upload, CheckCircle, Video, Briefcase, FileText, Search, MessageSquare, Download, Trash2, Plus } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Job, User, Interview, Message, Experience } from '../types';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import InterviewsTab from '../components/InterviewsTab';

// Helper for Base64
const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const CandidateDashboard: React.FC = () => {
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        apiRequest('/users/profile').then(setUser).catch(console.error);
        apiRequest('/jobs').then(data => setRecommendedJobs(data.slice(0, 3))).catch(console.error);
        apiRequest('/interviews/my-interviews').then(setInterviews).catch(console.error);
        apiRequest('/interviews/my-messages').then(setMessages).catch(console.error);
    }, []);

    return (
        <div className="space-y-8">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-[#7B2CBF]/20 to-purple-900/10 border border-[#7B2CBF]/20 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Hello, {user?.firstName || user?.name || 'Candidate'}!</h1>
                    <p className="text-neutral-300 max-w-xl">
                        Keep up the momentum! Apply to jobs and track your progress here.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Button onClick={() => window.location.href = '#/candidate/jobs'}>Browse Jobs</Button>
                        <Button variant="outline" onClick={() => window.location.href = '#/candidate/profile'}>Update Profile</Button>
                    </div>
                </div>
                <Briefcase className="absolute right-8 bottom-[-20px] w-48 h-48 text-[#7B2CBF]/10 rotate-12" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold">Recommended for You</h3>
                    {recommendedJobs.map(job => (
                        <Card key={job._id} className="group hover:border-[#7B2CBF] transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold group-hover:text-[#7B2CBF] transition-colors">{job.title}</h4>
                                    <p className="text-neutral-400">{job.company}</p>
                                </div>
                                <Badge variant="neutral">{job.type}</Badge>
                            </div>
                            <div className="flex items-center gap-6 mt-4 text-sm text-neutral-500">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                                {job.salary && <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</span>}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Side Column: Notifications */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold">Notifications</h3>

                    {/* Interviews */}
                    <Card title="Upcoming Interviews" className="border-l-4 border-l-[#7B2CBF]">
                        {interviews.length === 0 ? <p className="text-neutral-500 text-sm">No interviews scheduled.</p> : (
                            <div className="space-y-4">
                                {interviews.map(inv => (
                                    <div key={inv._id} className="p-3 bg-neutral-800 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video size={16} className="text-[#7B2CBF]" />
                                            <span className="font-semibold text-sm">Interview</span>
                                        </div>
                                        <p className="text-xs text-neutral-300 mb-1">With: {(inv.recruiterId as any)?.name}</p>
                                        <p className="text-xs text-neutral-400">{inv.date} at {inv.time}</p>
                                        {inv.meetingLink && (
                                            <a href={inv.meetingLink} target="_blank" className="text-xs text-[#7B2CBF] underline mt-2 block">Join Meeting</a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Messages */}
                    <Card title="Inbox">
                        {messages.length === 0 ? <p className="text-neutral-500 text-sm">No new messages.</p> : (
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
        </div>
    );
};

export const CandidateJobs: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [filters, setFilters] = useState({
        title: '',
        location: '',
        type: ''
    });

    const fetchJobs = () => {
        const queryParams = new URLSearchParams();
        if (filters.title) queryParams.append('title', filters.title);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.type) queryParams.append('type', filters.type);

        apiRequest(`/jobs?${queryParams.toString()}`).then(setJobs).catch(console.error);
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Debounce or just search on button click/enter could be better, but effect on deps is easy for now
    // However, to avoid too many calls, let's use a Search button or just rely on "Enter" key or blur.
    // For simplicity, I'll add a "Search" button and run fetchJobs on mount.

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const handleApply = async (id: string) => {
        try {
            await apiRequest(`/jobs/${id}/apply`, 'POST');
            alert('Applied successfully!');
        } catch (error) {
            alert('Failed to apply or already applied.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <h2 className="text-2xl font-bold">Browse Jobs</h2>
                <form onSubmit={handleSearch} className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4" />
                        <input
                            className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[#7B2CBF] outline-none"
                            placeholder="Job Title..."
                            value={filters.title}
                            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4" />
                        <input
                            className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[#7B2CBF] outline-none"
                            placeholder="Location..."
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-[#7B2CBF] outline-none"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Remote">Remote</option>
                    </select>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.length === 0 ? (
                    <p className="text-neutral-500 col-span-3 text-center py-12">No jobs found matching your criteria.</p>
                ) : (
                    jobs.map(job => (
                        <Card key={job._id} className="hover:-translate-y-1 transition-transform cursor-pointer flex flex-col h-full relative group" onClick={() => setSelectedJob(job)}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                                    <span className="text-black font-bold text-lg">{job.company.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <Badge variant="neutral">{job.type}</Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                            <p className="text-sm text-neutral-400 mb-4">{job.company} • {job.location}</p>
                            <div className="flex-1"></div>
                            <div className="flex gap-2 flex-wrap mb-6">
                                {job.salary && <span className="text-xs border border-neutral-700 rounded px-2 py-1 flex items-center gap-1"><DollarSign size={10} /> {job.salary}</span>}
                                {job.postedBy && <span className="text-xs text-neutral-500">Posted {new Date(job.createdAt).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>View Details</Button>
                                <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); handleApply(job._id); }}>Apply</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Job Details Modal */}
            <Modal isOpen={selectedJob !== null} onClose={() => setSelectedJob(null)} title="Job Details">
                {selectedJob && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedJob.title}</h2>
                                <p className="text-[#7B2CBF] font-medium text-lg">{selectedJob.company}</p>
                            </div>
                            <Badge variant="neutral" className="text-lg px-3 py-1">{selectedJob.type}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-neutral-300 border-b border-neutral-800 pb-6">
                            <span className="flex items-center gap-2"><MapPin size={16} className="text-[#7B2CBF]" /> {selectedJob.location}</span>
                            {selectedJob.salary && <span className="flex items-center gap-2"><DollarSign size={16} className="text-[#7B2CBF]" /> {selectedJob.salary}</span>}
                            <span className="flex items-center gap-2"><Clock size={16} className="text-[#7B2CBF]" /> Posted {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText size={18} className="text-[#7B2CBF]" /> Description</h3>
                            <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedJob.description}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-[#7B2CBF]" /> Requirements</h3>
                            <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedJob.requirements}
                            </div>
                        </div>

                        {selectedJob.skills && selectedJob.skills.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="neutral">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-neutral-800 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setSelectedJob(null)}>Close</Button>
                            <Button onClick={() => { handleApply(selectedJob._id); setSelectedJob(null); }}>Apply for this Job</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export const CandidateProfile: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', headline: '', bio: '', skills: ''
    });
    const [experience, setExperience] = useState<Experience[]>([]);
    const [education, setEducation] = useState<any[]>([]); // Use appropriate type if imported

    // New Experience Form State
    const [newExp, setNewExp] = useState<Experience>({
        company: '', designation: '', from: '', to: '', work: ''
    });
    const [showExpForm, setShowExpForm] = useState(false);

    // New Education Form State
    const [newEdu, setNewEdu] = useState({
        institution: '', degree: '', fieldOfStudy: '', from: '', to: ''
    });
    const [showEduForm, setShowEduForm] = useState(false);

    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user: User = await apiRequest('/users/profile');
                setFormData({
                    firstName: user.firstName || user.name.split(' ')[0] || '',
                    lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
                    headline: user.headline || '',
                    bio: user.bio || '',
                    skills: user.skills ? user.skills.join(', ') : ''
                });
                setExperience(user.experience || []);
                setEducation(user.education || []);
                setProfilePicture(user.profilePicture || null);
                if (user.resumeUrl || user.resume) {
                    setResumeName('Resume Uploaded');
                    setResumeUrl(user.resumeUrl || user.resume);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAddExperience = () => {
        if (!newExp.company || !newExp.designation || !newExp.from) {
            alert("Please fill in Company, Designation, and Start Date");
            return;
        }

        // Date Validation
        const fromDate = new Date(newExp.from);
        const toDate = newExp.to ? new Date(newExp.to) : null;
        const today = new Date();

        if (fromDate > today) {
            alert("Start date cannot be in the future.");
            return;
        }
        if (toDate && toDate > today) {
            alert("End date cannot be in the future.");
            return;
        }
        if (toDate && fromDate > toDate) {
            alert("Start date cannot be after end date.");
            return;
        }

        setExperience([...experience, newExp]);
        setNewExp({ company: '', designation: '', from: '', to: '', work: '' });
        setShowExpForm(false);
    };

    const handleRemoveExperience = (index: number) => {
        const updated = [...experience];
        updated.splice(index, 1);
        setExperience(updated);
    };

    const handleAddEducation = () => {
        if (!newEdu.institution || !newEdu.degree || !newEdu.from) {
            alert("Please fill in Institution, Degree, and Start Date");
            return;
        }

        // Date Validation
        const fromDate = new Date(newEdu.from);
        const toDate = newEdu.to ? new Date(newEdu.to) : null;
        const today = new Date();

        if (fromDate > today) {
            alert("Start date cannot be in the future.");
            return;
        }
        if (toDate && toDate > today) {
            alert("End date cannot be in the future.");
            return;
        }
        if (toDate && fromDate > toDate) {
            alert("Start date cannot be after end date.");
            return;
        }

        setEducation([...education, newEdu]);
        setNewEdu({ institution: '', degree: '', fieldOfStudy: '', from: '', to: '' });
        setShowEduForm(false);
    };

    const handleRemoveEducation = (index: number) => {
        const updated = [...education];
        updated.splice(index, 1);
        setEducation(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Input Sanitization
            const nameRegex = /^[a-zA-Z\s]*$/;
            if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
                alert('First Name and Last Name can only contain letters and spaces.');
                setSaving(false);
                return;
            }

            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await apiRequest('/users/profile', 'PUT', {
                ...formData,
                skills: skillsArray,
                experience: experience,
                education: education
            });
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profilePicture' | 'resume') => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];

                if (type === 'resume') {
                    if (file.type !== 'application/pdf') {
                        alert('Only PDF files are allowed for resumes.');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('resume', file);

                    const token = localStorage.getItem('token');
                    // Use relative path to avoid CORS/Port issues in dev/prod
                    const res = await fetch('/api/users/resume', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!res.ok) throw new Error('Upload failed');

                    const data = await res.json();
                    setResumeName(file.name);
                    setResumeUrl(data.resumeUrl);
                    alert('Resume updated successfully!');

                } else {
                    // Profile Picture Upload
                    const formData = new FormData();
                    formData.append('profilePicture', file);

                    const response = await apiRequest('/users/profile-picture', 'POST', formData);
                    setProfilePicture(response.profilePicture);
                    alert('Photo updated');
                }
            } catch (e: any) {
                console.error(e);
                alert(`Upload failed: ${e.message || 'Unknown error'}`);
            }
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">My Profile</h2>

            <Card className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#7B2CBF] bg-neutral-800 flex items-center justify-center">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img src="/assets/default-avatar.png" alt="Profile" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none border border-neutral-700 text-neutral-300 hover:border-white hover:text-white bg-transparent px-3 py-1.5 text-sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Change Photo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePicture')} />
                        </label>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                        <Input label="Professional Headline" placeholder="e.g. Senior Full Stack Developer" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Bio</label>
                            <textarea className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-24 focus:border-[#7B2CBF] outline-none"
                                placeholder="Tell recruiters about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Work Experience">
                <div className="space-y-4">
                    {experience.map((exp, idx) => (
                        <div key={idx} className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-800 relative group">
                            <button
                                onClick={() => handleRemoveExperience(idx)}
                                className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                            <h4 className="font-bold text-white text-lg">{exp.designation}</h4>
                            <p className="text-[#7B2CBF] font-medium">{exp.company}</p>
                            <p className="text-xs text-neutral-400 mb-2">{exp.from} - {exp.to || 'Present'}</p>
                            <p className="text-sm text-neutral-300">{exp.work}</p>
                        </div>
                    ))}

                    {showExpForm ? (
                        <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-lg space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Company" placeholder="Google" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
                                <Input label="Designation" placeholder="Software Engineer" value={newExp.designation} onChange={e => setNewExp({ ...newExp, designation: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="From" type="date" value={newExp.from} onChange={e => setNewExp({ ...newExp, from: e.target.value })} />
                                <Input label="To" type="date" value={newExp.to} onChange={e => setNewExp({ ...newExp, to: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Description</label>
                                <textarea
                                    className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white h-20 focus:border-[#7B2CBF] outline-none"
                                    placeholder="Describe your role..."
                                    value={newExp.work}
                                    onChange={e => setNewExp({ ...newExp, work: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setShowExpForm(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddExperience}>Add Experience</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowExpForm(true)}>
                            <Plus size={18} className="mr-2" /> Add Position
                        </Button>
                    )}
                </div>
            </Card>

            <Card title="Education">
                <div className="space-y-4">
                    {education.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-800 relative group">
                            <button
                                onClick={() => handleRemoveEducation(idx)}
                                className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                            <h4 className="font-bold text-white text-lg">{edu.institution}</h4>
                            <p className="text-[#7B2CBF] font-medium">{edu.degree}, {edu.fieldOfStudy}</p>
                            <p className="text-xs text-neutral-400 mb-2">{edu.from} - {edu.to || 'Present'}</p>
                        </div>
                    ))}

                    {showEduForm ? (
                        <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-lg space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Institution" placeholder="Stanford University" value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} />
                                <Input label="Degree" placeholder="Bachelor's" value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Field of Study" placeholder="Computer Science" value={newEdu.fieldOfStudy} onChange={e => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="From" type="date" value={newEdu.from} onChange={e => setNewEdu({ ...newEdu, from: e.target.value })} />
                                <Input label="To" type="date" value={newEdu.to} onChange={e => setNewEdu({ ...newEdu, to: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setShowEduForm(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleAddEducation}>Add Education</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowEduForm(true)}>
                            <Plus size={18} className="mr-2" /> Add Education
                        </Button>
                    )}
                </div>
            </Card>

            <Card title="Skills & Resume">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Skills (Comma separated)</label>
                        <Input placeholder="React, Node.js, TypeScript..." value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.skills.split(',').filter(s => s.trim()).map((skill, idx) => (
                                <Badge key={idx} variant="neutral">{skill.trim()}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-6">
                        <label className="block text-sm font-medium text-neutral-400 mb-3">Resume / CV</label>
                        <label className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:bg-neutral-800/50 transition-colors cursor-pointer block">
                            <FileText className="w-8 h-8 mx-auto text-neutral-500 mb-2" />
                            <p className="text-neutral-300 font-medium">{resumeName || "Click to upload or drag and drop"}</p>
                            <p className="text-xs text-neutral-500 mt-1">PDF Only (Max 10MB)</p>
                            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileChange(e, 'resume')} />
                        </label>
                        {resumeUrl && (
                            <div className="mt-4 flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-[#7B2CBF]" />
                                    <span className="text-sm text-neutral-300">Resume Uploaded</span>
                                </div>
                                <a href={resumeUrl} target="_blank" className="text-xs text-[#7B2CBF] hover:underline flex items-center gap-1">
                                    <Download size={12} /> Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <ChangePasswordForm />

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

export const CandidateInterviews: React.FC = () => <InterviewsTab role="CANDIDATE" />;
