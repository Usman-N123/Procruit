const User = require('../models/User');
const Organization = require('../models/Organization');
const Profile = require('../models/Profile'); // For future use when profile data is sent
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register Organization & Admin
// @route   POST /api/auth/register-org
// @access  Public
exports.registerOrg = async (req, res) => {
    const { name, email, password, website, description } = req.body;
    // Default orgName if not provided (for quick signup)
    const orgName = req.body.orgName || `${name}'s Organization`;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // 1. Create User (Admin)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'ORG_ADMIN' // Organization Admin
        });

        await user.save();

        // 2. Create Organization linked to Admin
        const organization = new Organization({
            name: orgName,
            admin: user._id,
            website,
            description
        });

        await organization.save();

        // 3. Link User to Organization
        user.organization = organization._id;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: organization,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add Recruiter (By Org Admin)
// @route   POST /api/org/recruiters
// @access  Private (Admin only)
exports.addRecruiter = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Ensure requester is an Admin and has an organization
        // req.user is set by authMiddleware
        const adminUser = await User.findById(req.user.id);
        if (!adminUser.organization) {
            return res.status(400).json({ message: 'Admin does not belong to an organization' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'RECRUITER',
            organization: adminUser.organization
        });

        await user.save();

        // Add recruiter to Organization's list
        await Organization.findByIdAndUpdate(adminUser.organization, {
            $push: { recruiters: user._id }
        });

        res.status(201).json({ message: 'Recruiter added successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Recruiters for Organization
// @route   GET /api/auth/recruiters
// @access  Private (Admin only)
exports.getRecruiters = async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser.organization) {
            return res.status(400).json({ message: 'Admin does not belong to an organization' });
        }

        const recruiters = await User.find({
            organization: adminUser.organization,
            role: 'RECRUITER'
        }).select('-password');

        res.json(recruiters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register Freelancer
// @route   POST /api/auth/register-freelancer
// @access  Public
exports.registerFreelancer = async (req, res) => {
    const { name, email, password, hourlyRate, yearsOfExperience, availability, headline, bio, skills } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'INTERVIEWER',
            // approvalStatus defaults to PENDING via schema
        });

        await user.save();

        // Create Profile
        const profile = new Profile({
            user: user._id,
            hourlyRate,
            yearsOfExperience,
            availability,
            headline,
            bio,
            skills
        });
        await profile.save();

        // Link Profile to User
        user.profile = profile._id;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            approvalStatus: user.approvalStatus,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register Candidate
// @route   POST /api/auth/register-candidate
// @access  Public
exports.registerCandidate = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Input Sanitization & Validation
        const nameRegex = /^[a-zA-Z\s]*$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ message: 'Name can only contain letters and spaces' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'CANDIDATE'
        });

        await user.save();

        // Create Initial Empty Profile
        const profile = new Profile({
            user: user._id
        });
        await profile.save();

        // Link Profile to User
        user.profile = profile._id;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('organization').populate('profile');
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            profile: user.profile,
            approvalStatus: user.approvalStatus,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid old password' });

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
