const User = require('../models/User');
const Job = require('../models/Job');
const Organization = require('../models/Organization');
const Profile = require('../models/Profile');
const Application = require('../models/Application');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalCandidates = await User.countDocuments({ role: 'CANDIDATE' });
        const totalRecruiters = await User.countDocuments({ role: { $in: ['RECRUITER', 'ORG_ADMIN'] } });
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        const totalApplications = await Application.countDocuments();

        const pendingFreelancers = await User.countDocuments({ role: 'INTERVIEWER', approvalStatus: 'PENDING' });

        const stats = {
            users: { candidates: totalCandidates, recruiters: totalRecruiters, total: totalCandidates + totalRecruiters },
            jobs: { active: activeJobs },
            applications: { total: totalApplications },
            pendingApprovals: pendingFreelancers
        };

        console.log("Admin fetching stats:", stats);
        res.status(200).json({ success: true, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (with optional role filter)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .populate('organization', 'name')
            .sort({ createdAt: -1 });

        console.log(`Admin fetching users... Found ${users.length} users.`);
        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user (Cascade delete)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent deleting self (Super Admin)
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        // --- Cascade Logic ---

        // 1. Delete Profile if exists
        if (user.profile) {
            await Profile.findByIdAndDelete(user.profile);
        }

        // 2. If ORG_ADMIN: Delete Organization and its Recruiters
        if (user.role === 'ORG_ADMIN') {
            const org = await Organization.findOne({ admin: user._id });
            if (org) {
                // Find all recruiters in this org
                const recruiters = await User.find({ organization: org._id });
                for (const rec of recruiters) {
                    // Delete mock jobs posted by these recruiters
                    await Job.deleteMany({ postedBy: rec._id });
                    // Delete the recruiter user
                    await User.findByIdAndDelete(rec._id);
                }
                // Delete the Organization
                await Organization.findByIdAndDelete(org._id);
            }
        }

        // 3. If RECRUITER: Remove from Org list and delete their jobs
        if (user.role === 'RECRUITER') {
            await Job.deleteMany({ postedBy: user._id });
            if (user.organization) {
                await Organization.findByIdAndUpdate(user.organization, {
                    $pull: { recruiters: user._id }
                });
            }
        }

        // 4. Delete Applications (if Candidate)
        if (user.role === 'CANDIDATE') {
            await Application.deleteMany({ candidate: user._id });
        }

        // Finally, delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all jobs
// @route   GET /api/admin/jobs
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('postedBy', 'name kemail')
            .sort({ createdAt: -1 });

        console.log(`Admin fetching jobs... Found ${jobs.length} jobs.`);
        res.status(200).json({ success: true, jobs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        // Also remove applications? (Optional, MongoDB usually orphans are fine or handled by separate cleanup)
        await Application.deleteMany({ job: req.params.id });

        res.json({ message: 'Job deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending freelancers
// @route   GET /api/admin/freelancers/pending
exports.getPendingFreelancers = async (req, res) => {
    try {
        const freelancers = await User.find({
            role: 'INTERVIEWER',
            approvalStatus: 'PENDING'
        }).select('-password').populate('profile');

        console.log(`Admin fetching pending freelancers... Found ${freelancers.length}.`);
        res.status(200).json({ success: true, users: freelancers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve/Reject freelancer
// @route   PATCH /api/admin/freelancers/:id/approve
exports.approveFreelancer = async (req, res) => {
    try {
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: status },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
