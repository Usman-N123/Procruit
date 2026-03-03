import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Modal, Button, Badge } from './UI';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';

interface ApplyWithCVModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
}

type ModalState = 'upload' | 'analyzing' | 'success' | 'error';

interface AIResult {
    aiScore: number | null;
    matchedKeywords: string[];
    missingKeywords: string[];
    aiAnalyzed: boolean;
}

export const ApplyWithCVModal: React.FC<ApplyWithCVModalProps> = ({ isOpen, onClose, jobId, jobTitle }) => {
    const [file, setFile] = useState<File | null>(null);
    const [state, setState] = useState<ModalState>('upload');
    const [aiResult, setAiResult] = useState<AIResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const f = acceptedFiles[0];
            if (f.type !== 'application/pdf') {
                setErrorMessage('Only PDF files are accepted.');
                return;
            }
            if (f.size > 10 * 1024 * 1024) {
                setErrorMessage('File size must be under 10MB.');
                return;
            }
            setFile(f);
            setErrorMessage('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        multiple: false,
    } as any);

    const handleSubmit = async () => {
        if (!file) return;

        setState('analyzing');
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const token = localStorage.getItem('token');
            const res = await fetch(`/api/applications/${jobId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
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
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong');
            setState('error');
        }
    };

    const handleClose = () => {
        setFile(null);
        setState('upload');
        setAiResult(null);
        setErrorMessage('');
        onClose();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Excellent Match' };
        if (score >= 50) return { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Good Match' };
        return { color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Low Match' };
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Apply for ${jobTitle}`}>
            <div className="space-y-6">
                {/* Upload State */}
                {state === 'upload' && (
                    <>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                                ? 'border-[#7B2CBF] bg-[#7B2CBF]/10 scale-[1.02]'
                                : file
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-neutral-700 hover:border-[#7B2CBF]/50 hover:bg-neutral-800/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="ml-auto p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-[#7B2CBF]/10 flex items-center justify-center mx-auto mb-4">
                                        <Upload className="w-8 h-8 text-[#7B2CBF]" />
                                    </div>
                                    <p className="text-white font-medium mb-1">
                                        {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
                                    </p>
                                    <p className="text-xs text-neutral-500">or click to browse • PDF only • Max 10MB</p>
                                </>
                            )}
                        </div>

                        {errorMessage && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                <AlertCircle size={16} />
                                {errorMessage}
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-[#7B2CBF]/5 border border-[#7B2CBF]/20 rounded-xl">
                            <Sparkles className="w-5 h-5 text-[#7B2CBF] flex-shrink-0" />
                            <p className="text-xs text-neutral-300">
                                Our AI will analyze your CV against the job requirements and provide an instant suitability score.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={!file}>
                                Submit Application
                            </Button>
                        </div>
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
                            <Button onClick={() => setState('upload')}>Try Again</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
