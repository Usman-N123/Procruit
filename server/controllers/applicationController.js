const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Profile = require('../models/Profile');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// AI Service config
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Helper: Save PDF buffer to local uploads directory
 * Returns the public URL path for the saved file
 */
const saveResumeFile = (fileBuffer, originalName) => {
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'resumes');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalName) || '.pdf';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, fileBuffer);

    // Return relative URL that can be served by Express static middleware
    return `/uploads/resumes/${filename}`;
};

/**
 * Helper: Call the Python AI service for CV parsing
 * Returns { suitability_score, matched_keywords, missing_keywords } or null on failure
 */
const callAIService = async (fileBuffer, originalName, jobDescription) => {
    try {
        // Dynamic import for node-fetch (v2 CommonJS)
        const fetch = require('node-fetch');
        const FormData = require('form-data');

        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: originalName || 'resume.pdf',
            contentType: 'application/pdf',
        });
        form.append('job_description', jobDescription);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const response = await fetch(`${AI_SERVICE_URL}/api/ai/parse-cv`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[AI Service] Non-OK response:', response.status, errorBody);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[AI Service] Request timed out after', AI_TIMEOUT_MS, 'ms');
        } else {
            console.error('[AI Service] Error calling AI service:', error.message);
        }
        return null; // Graceful degradation
    }
};

// @desc    Apply to a job with CV upload + AI analysis
// @route   POST /api/applications/:jobId
// @access  Private (Candidate)
exports.applyWithCV = async (req, res) => {
    try {
        const { jobId } = req.params;

        // 1. Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // 2. Check for duplicate application
        const existingApplication = await Application.findOne({
            job: job._id,
            candidate: req.user.id,
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        // 3. Validate uploaded file
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF resume' });
        }

        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'Only PDF files are accepted' });
        }

        // 4. Save file to local uploads for persistence
        let resumeUrl = null;
        try {
            resumeUrl = saveResumeFile(req.file.buffer, req.file.originalname);
        } catch (fileErr) {
            console.error('[File Upload] Error saving resume:', fileErr.message);
            // Non-blocking: continue even if file save fails
        }

        // 5. Get user profile data for snapshot
        const user = await User.findById(req.user.id).populate('profile');
        let profileData = {};
        if (user.profile) {
            if (user.profile._id) {
                profileData = user.profile;
            } else {
                profileData = await Profile.findById(user.profile);
            }
        }

        // 6. Build job description text for AI
        const jobDescriptionText = [
            job.description || '',
            job.requirements || '',
            (job.skills || []).join(', '),
        ].filter(Boolean).join('\n\n');

        // 7. Call AI service (with graceful degradation)
        const aiResult = await callAIService(
            req.file.buffer,
            req.file.originalname,
            jobDescriptionText
        );

        // 8. Create application
        const applicationData = {
            job: job._id,
            candidate: req.user.id,
            resume: user.resumeUrl || (profileData ? profileData.resume : null),
            resumeUrl: resumeUrl,
            experience: profileData ? profileData.experience : [],
            education: profileData ? profileData.education : [],
            skills: profileData ? profileData.skills : [],
        };

        if (aiResult) {
            // AI succeeded
            applicationData.aiScore = aiResult.suitability_score;
            applicationData.matchedKeywords = aiResult.matched_keywords || [];
            applicationData.missingKeywords = aiResult.missing_keywords || [];
            applicationData.status = 'Applied';
        } else {
            // AI failed — graceful degradation
            applicationData.aiScore = null;
            applicationData.matchedKeywords = [];
            applicationData.missingKeywords = [];
            applicationData.status = 'Pending AI';
        }

        const application = new Application(applicationData);
        await application.save();

        // 9. Add to job applicants
        job.applicants.push(req.user.id);
        await job.save();

        // 10. Return success
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                _id: application._id,
                aiScore: application.aiScore,
                matchedKeywords: application.matchedKeywords,
                missingKeywords: application.missingKeywords,
                status: application.status,
                resumeUrl: application.resumeUrl,
            },
            aiAnalyzed: aiResult !== null,
        });
    } catch (err) {
        console.error('[applyWithCV] Error:', err);
        res.status(500).json({ message: 'Server error while processing application' });
    }
};

// @desc    Get ranked candidates for a specific job
// @route   GET /api/jobs/:jobId/candidates
// @access  Private (Recruiter)
exports.getRankedCandidates = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Verify the job exists and belongs to this recruiter
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view candidates for this job' });
        }

        // Fetch all applications, sorted by AI score descending
        // Applications with null aiScore go to the end
        const applications = await Application.find({ job: jobId })
            .populate({
                path: 'candidate',
                select: 'name email profilePicture headline',
                populate: { path: 'profile' },
            })
            .sort({ aiScore: -1 })
            .lean();

        // Move null-score applications to the end
        const scored = applications.filter(a => a.aiScore !== null);
        const unscored = applications.filter(a => a.aiScore === null);

        res.json({
            jobTitle: job.title,
            totalCandidates: applications.length,
            candidates: [...scored, ...unscored],
        });
    } catch (err) {
        console.error('[getRankedCandidates] Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
