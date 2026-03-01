import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, Video, Plus, User, Briefcase,
    ExternalLink, Search, X
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Card, Button, Badge, Modal, Input } from './UI';
import { useToast } from './Toast';

interface InterviewData {
    _id: string;
    meetingId: string;
    scheduledTime: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
    paymentStatus?: 'Unpaid' | 'Paid';
    notes?: string;
    candidateId: { _id: string; name: string; email: string; profilePicture?: string };
    recruiterId: { _id: string; name: string; email: string; profilePicture?: string };
    jobId?: { _id: string; title: string; company: string };
}

interface CandidateOption {
    _id: string;
    name: string;
    email: string;
}

interface JobOption {
    _id: string;
    title: string;
    company: string;
}

interface InterviewsTabProps {
    role: 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER';
}

const statusBadgeVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    Scheduled: 'info',
    InProgress: 'warning',
    Completed: 'success',
    Cancelled: 'danger',
};

const InterviewsTab: React.FC<InterviewsTabProps> = ({ role }) => {
    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Schedule form state (Recruiter only)
    const [candidates, setCandidates] = useState<CandidateOption[]>([]);
    const [jobs, setJobs] = useState<JobOption[]>([]);
    const [formData, setFormData] = useState({
        candidateId: '',
        jobId: '',
        scheduledDate: '',
        scheduledTime: '',
        notes: '',
    });
    const [scheduling, setScheduling] = useState(false);

    // Fetch interviews
    useEffect(() => {
        fetchInterviews();

        // Check for Stripe redirect query params
        const query = new URLSearchParams(window.location.search);
        if (query.get('payment') === 'success') {
            addToast('success', 'Payment successful! Interview confirmed.');
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (query.get('payment') === 'cancelled') {
            addToast('warning', 'Payment was cancelled.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/interviews/my-interviews');
            console.log('InterviewsTab fetched:', data);
            setInterviews(data);
        } catch (err: any) {
            addToast('error', err.message || 'Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    // Fetch candidates and jobs for scheduling (Recruiter)
    const openScheduleModal = async () => {
        setShowScheduleModal(true);
        try {
            const [candidatesData, jobsData] = await Promise.all([
                apiRequest('/users/candidates'),
                apiRequest('/jobs/my-jobs'),
            ]);
            setCandidates(candidatesData || []);
            setJobs(jobsData || []);
        } catch {
            // Fallback: fetch from users endpoint
            try {
                const usersData = await apiRequest('/admin/users');
                const filteredCandidates = (usersData || []).filter((u: any) => u.role === 'CANDIDATE');
                setCandidates(filteredCandidates);
            } catch {
                addToast('error', 'Failed to load candidates list');
            }
        }
    };

    const handleSchedule = async () => {
        if (!formData.candidateId || !formData.scheduledDate || !formData.scheduledTime) {
            addToast('error', 'Please fill in all required fields');
            return;
        }

        setScheduling(true);
        try {
            const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

            await apiRequest('/interviews/schedule', 'POST', {
                candidateId: formData.candidateId,
                jobId: formData.jobId || undefined,
                scheduledTime,
                notes: formData.notes,
            });

            addToast('success', 'Interview scheduled successfully!');
            setShowScheduleModal(false);
            setFormData({ candidateId: '', jobId: '', scheduledDate: '', scheduledTime: '', notes: '' });
            fetchInterviews();
        } catch (err: any) {
            addToast('error', err.message || 'Failed to schedule interview');
        } finally {
            setScheduling(false);
        }
    };

    const joinInterview = (meetingId: string) => {
        navigate(`/interview/room/${meetingId}`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isJoinable = (interview: InterviewData) => {
        return interview.status === 'Scheduled' || interview.status === 'InProgress';
    };

    const handlePayment = async (interviewId: string) => {
        try {
            const res = await apiRequest('/payments/create-checkout-session', 'POST', { interviewId });
            if (res.url) {
                window.location.href = res.url; // Redirect to Stripe Checkout
            }
        } catch (error: any) {
            addToast('error', error.message || 'Payment initiation failed');
        }
    };

    // Split interviews into upcoming vs past
    const now = new Date();
    const upcomingInterviews = interviews.filter(
        (i) => new Date(i.scheduledTime) >= now && i.status !== 'Cancelled'
    );
    const pastInterviews = interviews.filter(
        (i) => new Date(i.scheduledTime) < now || i.status === 'Cancelled' || i.status === 'Completed'
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#7B2CBF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ToastContainer />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Interviews</h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        {role === 'RECRUITER'
                            ? 'Schedule and manage your interview sessions'
                            : 'View your upcoming and past interviews'}
                    </p>
                </div>
                {role === 'RECRUITER' && (
                    <Button icon={Plus} onClick={openScheduleModal}>
                        Schedule Interview
                    </Button>
                )}
            </div>

            {/* Upcoming Interviews */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-[#7B2CBF]" />
                    Upcoming
                </h3>
                {upcomingInterviews.length === 0 ? (
                    <Card>
                        <div className="text-center py-8">
                            <Calendar size={40} className="text-neutral-700 mx-auto mb-3" />
                            <p className="text-neutral-500">No upcoming interviews</p>
                            {role === 'RECRUITER' && (
                                <Button variant="outline" size="sm" className="mt-3" onClick={openScheduleModal}>
                                    Schedule One
                                </Button>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {upcomingInterviews.map((interview) => (
                            <Card key={interview._id} className="hover:border-[#7B2CBF]/30 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold text-lg">
                                            {(role === 'RECRUITER'
                                                ? interview.candidateId?.name
                                                : interview.recruiterId?.name
                                            )?.charAt(0)?.toUpperCase() || '?'}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white">
                                                    {role === 'RECRUITER'
                                                        ? interview.candidateId?.name
                                                        : interview.recruiterId?.name}
                                                </h4>
                                                <Badge variant={statusBadgeVariant[interview.status] || 'neutral'}>
                                                    {interview.status}
                                                </Badge>
                                                {role === 'RECRUITER' && interview.paymentStatus && (
                                                    <Badge variant={interview.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                                                        {interview.paymentStatus}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={13} />
                                                    {formatDate(interview.scheduledTime)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={13} />
                                                    {formatTime(interview.scheduledTime)}
                                                </span>
                                                {interview.jobId && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase size={13} />
                                                        {interview.jobId.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        {role === 'RECRUITER' && interview.paymentStatus === 'Unpaid' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-green-500 text-green-500 hover:bg-green-500/10"
                                                onClick={() => handlePayment(interview._id)}
                                            >
                                                Pay & Confirm
                                            </Button>
                                        )}
                                        {isJoinable(interview) && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                icon={Video}
                                                onClick={() => joinInterview(interview.meetingId)}
                                            >
                                                Join Room
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Interviews */}
            {pastInterviews.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Clock size={18} className="text-neutral-500" />
                        Past
                    </h3>
                    <div className="grid gap-3">
                        {pastInterviews.map((interview) => (
                            <Card key={interview._id} className="opacity-70">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold">
                                            {(role === 'RECRUITER'
                                                ? interview.candidateId?.name
                                                : interview.recruiterId?.name
                                            )?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-neutral-300">
                                                {role === 'RECRUITER'
                                                    ? interview.candidateId?.name
                                                    : interview.recruiterId?.name}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                                                <span>{formatDate(interview.scheduledTime)}</span>
                                                {interview.jobId && <span>{interview.jobId.title}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={statusBadgeVariant[interview.status] || 'neutral'}>
                                        {interview.status}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Schedule Interview Modal (Recruiter only) */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title="Schedule Interview"
            >
                <div className="space-y-4">
                    {/* Candidate Select */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                            Candidate <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.candidateId}
                            onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                            className="w-full bg-black/50 border border-neutral-800 rounded-lg py-2.5 px-4 text-white focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF] transition-all outline-none"
                        >
                            <option value="">Select a candidate...</option>
                            {candidates.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} ({c.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Job Select (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Job (Optional)</label>
                        <select
                            value={formData.jobId}
                            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                            className="w-full bg-black/50 border border-neutral-800 rounded-lg py-2.5 px-4 text-white focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF] transition-all outline-none"
                        >
                            <option value="">No specific job</option>
                            {jobs.map((j) => (
                                <option key={j._id} value={j._id}>
                                    {j.title} — {j.company}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Date *"
                            type="date"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        />
                        <Input
                            label="Time *"
                            type="time"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Interview focus areas, preparation instructions..."
                            className="w-full bg-black/50 border border-neutral-800 rounded-lg py-2.5 px-4 text-white placeholder-neutral-600 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF] transition-all outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={handleSchedule}
                            disabled={scheduling}
                        >
                            {scheduling ? 'Scheduling...' : 'Schedule Interview'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InterviewsTab;
