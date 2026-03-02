const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Get eligible candidates for scheduling (only those who applied to recruiter's jobs)
// @route   GET /api/interviews/eligible-candidates
// @access  Private (Recruiter only)
exports.getEligibleCandidates = async (req, res) => {
    try {
        console.log('[eligible-candidates] Handler reached. User:', req.user?._id, 'Role:', req.user?.role);

        // Step 1: Find all jobs where postedBy matches the logged-in recruiter
        const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);
        console.log('[eligible-candidates] Step 1 - Found jobs:', jobIds.length, jobIds);

        if (jobIds.length === 0) {
            console.log('[eligible-candidates] No jobs found, returning empty array');
            return res.json([]); // No jobs posted, so no eligible candidates
        }

        // Step 2: Find all applications for those jobs, populating the candidate details
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate('candidate', 'name email profilePicture');
        console.log('[eligible-candidates] Step 2 - Found applications:', applications.length);

        // Step 3: Deduplicate candidates (a candidate may have applied to multiple jobs)
        const seen = new Set();
        const uniqueCandidates = [];

        for (const app of applications) {
            // Guard against null/missing candidate refs
            if (!app.candidate || !app.candidate._id) continue;

            const candidateIdStr = app.candidate._id.toString();
            if (!seen.has(candidateIdStr)) {
                seen.add(candidateIdStr);
                uniqueCandidates.push({
                    _id: app.candidate._id,
                    name: app.candidate.name,
                    email: app.candidate.email,
                    profilePicture: app.candidate.profilePicture || null,
                });
            }
        }

        console.log('[eligible-candidates] Step 3 - Unique candidates:', uniqueCandidates.length);

        // Step 4: Return the clean, unique list
        return res.json(uniqueCandidates);
    } catch (err) {
        console.error('[eligible-candidates] ERROR:', err.message, err.stack);
        return res.status(500).json({ message: 'Failed to fetch eligible candidates' });
    }
};
