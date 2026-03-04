import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { ArrowLeft, Trophy, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Search, Users, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

interface RankedCandidate {
    _id: string;
    candidate: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
        headline?: string;
        profile?: any;
    };
    aiScore: number | null;
    matchedKeywords: string[];
    missingKeywords: string[];
    status: string;
    appliedAt: string;
    resumeUrl?: string;
}

const SuitabilityBadge: React.FC<{ score: number | null }> = ({ score }) => {
    if (score === null) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-700/50 text-neutral-400 border border-neutral-600/50">
                <AlertCircle size={12} />
                Pending
            </span>
        );
    }

    if (score >= 80) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                <Trophy size={12} />
                Excellent ({score}%)
            </span>
        );
    }

    if (score >= 50) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                <TrendingUp size={12} />
                Good ({score}%)
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            Low ({score}%)
        </span>
    );
};

const ScoreBar: React.FC<{ score: number }> = ({ score }) => (
    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
        <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${score >= 80 ? 'bg-emerald-500' :
                score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
            style={{ width: `${score}%` }}
        />
    </div>
);

export const RankedCandidates: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
    const [jobTitle, setJobTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [retryingScores, setRetryingScores] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!jobId) return;

        const fetchCandidates = async () => {
            try {
                const data = await apiRequest(`/applications/${jobId}/candidates`);
                setCandidates(data.candidates || []);
                setJobTitle(data.jobTitle || 'Unknown Job');
            } catch (err: any) {
                setError(err.message || 'Failed to load candidates');
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, [jobId]);

    const filteredCandidates = candidates.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.candidate?.name?.toLowerCase().includes(term) ||
            c.candidate?.email?.toLowerCase().includes(term) ||
            c.matchedKeywords?.some(kw => kw.toLowerCase().includes(term))
        );
    });

    const avgScore = candidates.filter(c => c.aiScore !== null).length > 0
        ? Math.round(
            candidates
                .filter(c => c.aiScore !== null)
                .reduce((sum, c) => sum + (c.aiScore || 0), 0) /
            candidates.filter(c => c.aiScore !== null).length
        )
        : 0;

    const excellentCount = candidates.filter(c => c.aiScore !== null && c.aiScore >= 80).length;

    const handleRetryAI = async (applicationId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent row expansion toggle
        setRetryingScores(prev => {
            const newSet = new Set(prev);
            newSet.add(applicationId);
            return newSet;
        });

        try {
            const formData = new FormData(); // The backend expects the ID in URL, body can be empty.
            const data = await apiRequest(`/applications/${applicationId}/retry-ai`, 'POST', formData);

            // On success, update the candidates list to trigger re-render of badge, score, skills, etc.
            setCandidates(prev =>
                prev.map(c =>
                    c._id === applicationId
                        ? { ...c, aiScore: data.application.aiScore, matchedKeywords: data.application.matchedKeywords, missingKeywords: data.application.missingKeywords, status: data.application.status }
                        : c
                ).sort((a, b) => {
                    // Re-sort so new scores show up higher
                    if (a.aiScore === null && b.aiScore === null) return 0;
                    if (a.aiScore === null) return 1;
                    if (b.aiScore === null) return -1;
                    return b.aiScore - a.aiScore;
                })
            );

            alert('AI analysis successful!');
        } catch (err: any) {
            console.error(err);
            alert(`Retry failed: ${err.message}`);
        } finally {
            setRetryingScores(prev => {
                const newSet = new Set(prev);
                newSet.delete(applicationId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-neutral-800 border-t-[#7B2CBF] animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Loading ranked candidates...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error}</p>
                <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors mb-3 text-sm"
                    >
                        <ArrowLeft size={16} /> Back to Jobs
                    </button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-[#7B2CBF]" />
                        AI Ranked Candidates
                    </h2>
                    <p className="text-neutral-400 mt-1">
                        <span className="text-[#7B2CBF] font-medium">{jobTitle}</span> • {candidates.length} applicant{candidates.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 bg-gradient-to-br from-neutral-900 to-[#7B2CBF]/5 border-l-4 border-l-[#7B2CBF]">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-[#7B2CBF]" />
                        <div>
                            <h4 className="text-2xl font-bold text-white">{candidates.length}</h4>
                            <p className="text-xs text-neutral-400">Total Applicants</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-neutral-900 to-emerald-900/10 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-emerald-400" />
                        <div>
                            <h4 className="text-2xl font-bold text-white">{excellentCount}</h4>
                            <p className="text-xs text-neutral-400">Excellent Matches (≥80%)</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-neutral-900 to-blue-900/10 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                        <div>
                            <h4 className="text-2xl font-bold text-white">{avgScore}%</h4>
                            <p className="text-xs text-neutral-400">Average AI Score</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-3 text-neutral-500 w-4 h-4" />
                <input
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:border-[#7B2CBF] outline-none transition-colors"
                    placeholder="Search by name, email, or skill..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            {filteredCandidates.length === 0 ? (
                <Card className="text-center py-16">
                    <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">
                        {candidates.length === 0 ? 'No applicants yet.' : 'No candidates match your search.'}
                    </p>
                </Card>
            ) : (
                <Card className="overflow-hidden !p-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-800/50 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        <div className="col-span-1">#</div>
                        <div className="col-span-3">Candidate</div>
                        <div className="col-span-2">AI Score</div>
                        <div className="col-span-2">Suitability</div>
                        <div className="col-span-3">Top Skills</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Table Rows */}
                    {filteredCandidates.map((app, index) => (
                        <div key={app._id}>
                            <div
                                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors cursor-pointer ${index === 0 && app.aiScore !== null && app.aiScore >= 80 ? 'bg-emerald-500/5' : ''
                                    }`}
                                onClick={() => setExpandedRow(expandedRow === app._id ? null : app._id)}
                            >
                                {/* Rank */}
                                <div className="col-span-1">
                                    <span className={`text-sm font-bold ${index === 0 ? 'text-amber-400' :
                                        index === 1 ? 'text-neutral-300' :
                                            index === 2 ? 'text-amber-700' : 'text-neutral-500'
                                        }`}>
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Candidate */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <img
                                        src={app.candidate?.profilePicture || '/assets/default-avatar.png'}
                                        alt={app.candidate?.name}
                                        className="w-9 h-9 rounded-lg object-cover border border-neutral-700"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{app.candidate?.name}</p>
                                        <p className="text-xs text-neutral-500 truncate">{app.candidate?.email}</p>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="col-span-2">
                                    {app.aiScore !== null ? (
                                        <div className="space-y-1.5">
                                            <span className={`text-lg font-bold ${app.aiScore >= 80 ? 'text-emerald-400' :
                                                app.aiScore >= 50 ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {app.aiScore}
                                            </span>
                                            <ScoreBar score={app.aiScore} />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-neutral-500">—</span>
                                    )}
                                </div>

                                {/* Badge */}
                                <div className="col-span-2">
                                    <SuitabilityBadge score={app.aiScore} />
                                </div>

                                {/* Skills */}
                                <div className="col-span-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {app.matchedKeywords?.slice(0, 3).map((kw, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                        {(app.matchedKeywords?.length || 0) > 3 && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-800 text-neutral-400">
                                                +{app.matchedKeywords!.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Expand */}
                                <div className="col-span-1 flex justify-end">
                                    {expandedRow === app._id ? (
                                        <ChevronUp size={16} className="text-neutral-400" />
                                    ) : (
                                        <ChevronDown size={16} className="text-neutral-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedRow === app._id && (
                                <div className="px-6 py-5 bg-neutral-800/20 border-b border-neutral-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Matched */}
                                        <div>
                                            <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                ✅ Matched Skills ({app.matchedKeywords?.length || 0})
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {app.matchedKeywords?.map((kw, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                                    >
                                                        {kw}
                                                    </span>
                                                ))}
                                                {(!app.matchedKeywords || app.matchedKeywords.length === 0) && (
                                                    <span className="text-xs text-neutral-500">No matched keywords</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Missing */}
                                        <div>
                                            <h5 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                ❌ Missing Skills ({app.missingKeywords?.length || 0})
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {app.missingKeywords?.map((kw, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-300 border border-red-500/20"
                                                    >
                                                        {kw}
                                                    </span>
                                                ))}
                                                {(!app.missingKeywords || app.missingKeywords.length === 0) && (
                                                    <span className="text-xs text-neutral-500">No missing keywords</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-neutral-700/50">
                                        <span className="text-xs text-neutral-500">
                                            Applied: {new Date(app.appliedAt).toLocaleDateString()}
                                        </span>
                                        <Badge variant={app.status === 'Applied' ? 'info' : app.status === 'Pending AI' ? 'warning' : 'neutral'}>
                                            {app.status}
                                        </Badge>
                                        {app.aiScore === null && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="ml-auto"
                                                onClick={(e) => handleRetryAI(app._id, e)}
                                                disabled={retryingScores.has(app._id)}
                                            >
                                                {retryingScores.has(app._id) ? (
                                                    <span className="flex items-center gap-2 text-neutral-400">
                                                        <Loader2 size={14} className="animate-spin" /> Retrying AI...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <RefreshCw size={14} /> Retry AI Analysis
                                                    </span>
                                                )}
                                            </Button>
                                        )}

                                        {app.resumeUrl && app.aiScore !== null && (
                                            <a
                                                href={app.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#7B2CBF] hover:underline ml-auto"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Download CV
                                            </a>
                                        )}
                                        {app.resumeUrl && app.aiScore === null && (
                                            <a
                                                href={app.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#7B2CBF] hover:underline ml-3"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                CV
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
};
