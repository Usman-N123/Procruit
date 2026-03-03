import React, { useState, useEffect } from 'react';
import { Modal, Button } from './UI';
import { CheckCircle, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { User } from '../types';

interface ApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    onSuccess?: () => void;
}

type ModalState = 'initial' | 'analyzing' | 'success' | 'error';

interface AIResult {
    aiScore: number | null;
    matchedKeywords: string[];
    missingKeywords: string[];
    aiAnalyzed: boolean;
}

export const ApplyWithCVModal: React.FC<ApplyModalProps> = ({ isOpen, onClose, jobId, jobTitle, onSuccess }) => {
    const [state, setState] = useState<ModalState>('initial');
    const [aiResult, setAiResult] = useState<AIResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        if (isOpen) {
            apiRequest(`/users/profile?t=${Date.now()}`)
                .then((data) => {
                    console.log('ApplyModal Fetched User Profile Data:', data);
                    setUser(data);
                    setLoadingUser(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch user profile', err);
                    setLoadingUser(false);
                });

            // Reset state
            setState('initial');
            setAiResult(null);
            setErrorMessage('');
        }
    }, [isOpen]);

    const hasResume = user && (user.resumeUrl || user.resume || (user.profile && (user.profile as any).resume));

    const handleSubmit = async () => {
        if (!hasResume) return;

        setState('analyzing');
        setErrorMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/applications/${jobId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Application failed');
            }

            setAiResult({
                aiScore: data.application?.aiScore ?? null,
                matchedKeywords: data.application?.matchedKeywords || [],
                missingKeywords: data.application?.missingKeywords || [],
                aiAnalyzed: data.aiAnalyzed ?? false,
            });
            setState('success');
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong');
            setState('error');
        }
    };

    const handleClose = () => {
        setState('initial');
        setAiResult(null);
        setErrorMessage('');
        onClose();
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Excellent Match' };
        if (score >= 50) return { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Good Match' };
        return { color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Low Match' };
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Apply for ${jobTitle}`}>
            <div className="space-y-6">
                {/* Initial State */}
                {state === 'initial' && (
                    <>
                        {loadingUser ? (
                            <div className="flex justify-center py-8 text-neutral-400">Loading user data...</div>
                        ) : !hasResume ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Missing CV</h3>
                                <p className="text-sm text-neutral-400">
                                    Please update your profile and upload a CV before applying.
                                </p>
                                <Button
                                    className="mt-4"
                                    onClick={() => {
                                        handleClose();
                                        window.location.href = '#/candidate/profile';
                                    }}
                                >
                                    Go to Profile Settings
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="border border-neutral-700/50 rounded-xl p-5 bg-neutral-800/20">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-[#7B2CBF]/10 flex items-center justify-center text-[#7B2CBF]">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">Use Saved CV</h4>
                                            <p className="text-sm text-neutral-400">We will use the CV currently saved in your profile.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-[#7B2CBF]/5 border border-[#7B2CBF]/10 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-[#7B2CBF] flex-shrink-0" />
                                        <p className="text-xs text-neutral-300">
                                            Our AI will analyze your profile CV against the job requirements to calculate your suitability score.
                                        </p>
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                        <AlertCircle size={16} />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                                    <Button onClick={handleSubmit}>
                                        Submit Application
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Analyzing State */}
                {state === 'analyzing' && (
                    <div className="text-center py-12">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-neutral-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-[#7B2CBF] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                            <div className="absolute inset-3 rounded-full bg-[#7B2CBF]/10 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-[#7B2CBF] animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">AI is analyzing your application...</h3>
                        <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                            Parsing your CV and matching it against the job requirements. This usually takes a few seconds.
                        </p>
                        <div className="mt-6 flex justify-center gap-1">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-[#7B2CBF] animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Success State */}
                {state === 'success' && aiResult && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Application Submitted!</h3>
                            <p className="text-sm text-neutral-400">Your application has been sent to the recruiter.</p>
                        </div>

                        {aiResult.aiAnalyzed && aiResult.aiScore !== null && (
                            <>
                                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-neutral-300">AI Suitability Score</span>
                                        <span className={`text-sm font-medium px-3 py-1 rounded-full border ${getScoreBadge(aiResult.aiScore).color}`}>
                                            {getScoreBadge(aiResult.aiScore).label}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-5xl font-bold text-white">{aiResult.aiScore}</span>
                                        <span className="text-xl text-neutral-500 ml-1">/100</span>
                                    </div>
                                    <div className="mt-4 w-full bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${aiResult.aiScore >= 80 ? 'bg-emerald-500' :
                                                aiResult.aiScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${aiResult.aiScore}%` }}
                                        />
                                    </div>
                                </div>

                                {aiResult.matchedKeywords.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-neutral-300 mb-3">
                                            ✅ Matched Skills ({aiResult.matchedKeywords.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {aiResult.matchedKeywords.slice(0, 12).map((kw, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                                >
                                                    {kw}
                                                </span>
                                            ))}
                                            {aiResult.matchedKeywords.length > 12 && (
                                                <span className="px-2.5 py-1 text-xs rounded-full bg-neutral-800 text-neutral-400">
                                                    +{aiResult.matchedKeywords.length - 12} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!aiResult.aiAnalyzed && (
                            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-neutral-300">
                                    AI analysis is temporarily unavailable. Your application has been submitted and will be reviewed by the recruiter.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleClose}>Done</Button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Submission Failed</h3>
                        <p className="text-sm text-neutral-400 mb-6">{errorMessage}</p>
                        <div className="flex justify-center gap-3">
                            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button onClick={() => setState('initial')}>Try Again</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
