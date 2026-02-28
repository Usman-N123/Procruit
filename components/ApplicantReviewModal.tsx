import React, { useState } from 'react';
import { Modal, Button, Badge } from './UI';
import { User, Briefcase, GraduationCap, FileText, Download, BarChart2, Video, MessageSquare } from 'lucide-react';

interface ApplicantReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: any;
    onStatusUpdate: (id: string, status: string) => void;
    onSchedule: () => void;
    onMessage: () => void;
}

export const ApplicantReviewModal: React.FC<ApplicantReviewModalProps> = ({
    isOpen, onClose, application, onStatusUpdate, onSchedule, onMessage
}) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'experience' | 'education'>('summary');

    if (!application) return null;

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

    const data = getCandidateData(application);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Application Review" maxWidth="max-w-4xl">
            <div className="flex flex-col h-full max-h-[80vh]">

                {/* Header Section */}
                <div className="flex items-start gap-6 border-b border-neutral-800 pb-6 mb-6">
                    <img
                        src={data.profilePicture || "/assets/default-avatar.png"}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-neutral-800"
                        alt="profile"
                    />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 text-white">{data.name}</h2>
                                <p className="text-[#7B2CBF] font-medium mb-2">{data.headline}</p>
                                <p className="text-sm text-neutral-500">Applied for <span className="text-white font-medium">{application.job.title}</span></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <select
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#7B2CBF] outline-none transition-colors"
                                    value={application.status}
                                    onChange={(e) => onStatusUpdate(application._id, e.target.value)}
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Screening">Screening</option>
                                    <option value="Interview">Interview</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                {data.resume && (
                                    <a
                                        href={data.resume}
                                        target="_blank"
                                        rel="noreferrer" // Security best practice
                                        className="inline-flex items-center text-sm text-[#7B2CBF] hover:text-white transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-1.5" /> Download Resume
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-neutral-800 mb-6">
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'summary' ? 'border-[#7B2CBF] text-[#7B2CBF]' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Summary
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'experience' ? 'border-[#7B2CBF] text-[#7B2CBF]' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('experience')}
                    >
                        Experience
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'education' ? 'border-[#7B2CBF] text-[#7B2CBF]' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('education')}
                    >
                        Education
                    </button>
                </div>

                {/* Tabs Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">

                    {activeTab === 'summary' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><User size={18} className="text-[#7B2CBF]" /> About</h3>
                                <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                                    {data.bio || "No bio provided."}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><BarChart2 size={18} className="text-[#7B2CBF]" /> Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills?.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="neutral" className="bg-neutral-800 border-neutral-700 text-neutral-300">{skill}</Badge>
                                    )) || <p className="text-sm text-neutral-500">No skills listed.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                {data.experience?.map((exp: any, idx: number) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-neutral-800 hover:border-[#7B2CBF] transition-colors pb-6 last:pb-0">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-black border-2 border-neutral-600 group-hover:border-[#7B2CBF] transition-colors"></div>
                                        <h4 className="font-bold text-white text-lg">{exp.designation}</h4>
                                        <p className="text-[#7B2CBF] font-medium mb-1">{exp.company}</p>
                                        <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                                            <Briefcase size={12} /> {exp.from} - {exp.to || 'Present'}
                                        </p>
                                        {exp.work && <p className="text-sm text-neutral-400 mt-2">{exp.work}</p>}
                                    </div>
                                )) || <p className="text-sm text-neutral-500 italic">No experience added.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'education' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid gap-4">
                                {data.education?.map((edu: any, idx: number) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 p-4 rounded-lg flex items-start gap-4">
                                        <div className="p-3 bg-[#7B2CBF]/10 rounded-lg text-[#7B2CBF]">
                                            <GraduationCap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{edu.institution}</h4>
                                            <p className="text-[#7B2CBF] font-medium">{edu.degree}</p>
                                            <p className="text-sm text-neutral-400 mt-1">{edu.fieldOfStudy}</p>
                                            <p className="text-xs text-neutral-500 mt-2">{edu.from} - {edu.to || 'Present'}</p>
                                        </div>
                                    </div>
                                )) || <p className="text-sm text-neutral-500 italic">No education added.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="flex gap-3 pt-6 mt-2 border-t border-neutral-800">
                    <Button className="flex-1" icon={Video} onClick={onSchedule}>Schedule Interview</Button>
                    <Button variant="outline" className="flex-1" icon={MessageSquare} onClick={onMessage}>Send Message</Button>
                    <Button variant="outline" className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-900" onClick={() => onStatusUpdate(application._id, 'Rejected')}>Reject</Button>
                </div>
            </div>
        </Modal>
    );
};
