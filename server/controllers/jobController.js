const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
    try {
        const { title, location, type, minSalary, skill } = req.query;

        let query = { status: 'Active' };

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (type) {
            query.type = type;
        }

        if (skill) {
            query.skills = { $in: [new RegExp(skill, 'i')] };
        }

        // Note: Salary filtering is tricky with string. Skipping complex range for now.

        // Exclude jobs the user has already applied for (if logged in)
        if (req.user && req.user.id) {
            const appliedJobs = await Application.find({ candidate: req.user.id }).select('job');
            const appliedJobIds = appliedJobs.map(app => app.job);

            if (appliedJobIds.length > 0) {
                query._id = { $nin: appliedJobIds };
            }
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email companyName');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get jobs posted by current user (Recruiter)
// @route   GET /api/jobs/my-jobs
// @access  Private
exports.getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.id })
            .populate('applicants', 'name email profilePicture headline skills experience resume')
            .sort({ createdAt: -1 })
            .lean();

        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const count = await Application.countDocuments({ job: job._id });
            return {
                ...job,
                applicantCount: count
            };
        }));

        res.json(jobsWithCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Recruiter/Admin)
exports.createJob = async (req, res) => {
    try {
        const { title, description, requirements, company, location, type, salary, skills } = req.body;

        const job = new Job({
            title,
            description,
            requirements,
            company: company || (req.user.organization ? 'Organization' : 'Company'), // Fallback
            location,
            type,
            salary,
            skills,
            skills,
            postedBy: req.user.id // Ensure this is matching the Recruiter's ID
        });

        await job.save();
        res.status(201).json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidate)
exports.applyJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Prevent Duplicate Job Applications
        const existingApplication = await Application.findOne({
            job: job._id,
            candidate: req.user.id
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this position.' });
        }

        // Get user resume from profile (optional snapshot)
        const User = require('../models/User');
        const Profile = require('../models/Profile');

        const user = await User.findById(req.user.id).populate('profile');
        let profileData = {};

        if (user.profile) {
            // If profile is populated
            if (user.profile._id) {
                profileData = user.profile;
            } else {
                // Fallback if populate didn't work as expected or if it's just an ID
                profileData = await Profile.findById(user.profile);
            }
        }

        const application = new Application({
            job: job._id,
            candidate: req.user.id,
            resume: user.resumeUrl || (profileData ? profileData.resume : null),
            experience: profileData ? profileData.experience : [],
            education: profileData ? profileData.education : [],
            skills: profileData ? profileData.skills : []
        });

        await application.save();

        // Add to Job applicants
        job.applicants.push(req.user.id);
        await job.save();

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update application status
// @route   PUT /api/jobs/applications/:id/status
// @access  Private (Recruiter)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('job');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Verify that the user owns the job
        // We need to check if application.job.postedBy equals req.user.id
        // However, we populated 'job', so job is an object.
        // We assume job was populated. If not, we'd need to fetch it.
        // Wait, I populated it above.

        // Check ownership
        // Note: postedBy in Job model is ObjectId.
        if (application.job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        application.status = status;
        await application.save();

        res.json(application);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get applications received for jobs posted by current user
// @route   GET /api/jobs/applications/received
// @access  Private (Recruiter)
exports.getMyReceivedApplications = async (req, res) => {
    try {
        // 1. Find jobs posted by user
        const jobs = await Job.find({ postedBy: req.user.id }).select('_id');
        const jobIds = jobs.map(job => job._id);

        // 2. Find applications for these jobs
        // 2. Find applications for these jobs
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: 'candidate',
                select: 'name email profilePicture headline resumeUrl', // Select only fields that exist on User
                populate: { path: 'profile' } // Get full profile data (experience, etc.) from here
            })
            .populate('job', 'title')
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
