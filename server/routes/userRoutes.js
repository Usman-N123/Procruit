
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'secret123';
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Multer Storage
// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = decoded;
        next();
    });
};

// @route   GET /api/users/profile
// @desc    Get current logged in user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('profile');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current logged in user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const {
            firstName, lastName, profilePicture, // User fields
            headline, bio, skills, experience, education, resume, // Candidate Profile fields
            hourlyRate, yearsOfExperience, availability, // Interviewer Profile fields
            website, description // Org fields (if we want to update org here, but usually separate)
        } = req.body;

        // 1. Update User Fields
        const userUpdate = {};
        if (firstName) userUpdate.firstName = firstName;
        if (lastName) userUpdate.lastName = lastName;
        if (firstName || lastName) userUpdate.name = `${firstName || ''} ${lastName || ''}`.trim();
        if (profilePicture) userUpdate.profilePicture = profilePicture;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userUpdate },
            { new: true }
        ).select('-password').populate('profile');

        // 2. Update Profile Fields (if user has a profile)
        if (user.profile) {
            const profileUpdate = {};
            if (headline) profileUpdate.headline = headline;
            if (bio) profileUpdate.bio = bio;
            if (skills) profileUpdate.skills = skills;
            if (experience) profileUpdate.experience = experience;
            if (education) profileUpdate.education = education;
            if (resume) profileUpdate.resume = resume;

            if (hourlyRate) profileUpdate.hourlyRate = hourlyRate;
            if (yearsOfExperience) profileUpdate.yearsOfExperience = yearsOfExperience;
            if (availability) profileUpdate.availability = availability;

            const Profile = require('../models/Profile'); // Lazy load to avoid circular dependency issues if any
            const updatedProfile = await Profile.findByIdAndUpdate(
                user.profile._id,
                { $set: profileUpdate },
                { new: true }
            );

            // Re-assign updated profile to user object for response
            user.profile = updatedProfile;
        }

        // 3. Update Organization Fields (if user is Admin)
        if (user.role === 'ADMIN' && user.organization) {
            const orgUpdate = {};
            if (website) orgUpdate.website = website;
            if (description) orgUpdate.description = description;

            const Organization = require('../models/Organization');
            await Organization.findByIdAndUpdate(user.organization, { $set: orgUpdate });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/users/profile-picture
// @desc    Upload profile picture
router.post('/profile-picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // URL to access the file
        const profilePictureUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Update User model with profilePictureUrl
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: profilePictureUrl },
            { new: true }
        ).select('-password');

        res.json({ profilePicture: profilePictureUrl, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/users/interviewers
// @desc    Get list of freelance interviewers
router.get('/interviewers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'RECRUITER') return res.status(403).json({ message: 'Unauthorized' });

        const interviewers = await User.find({ role: 'INTERVIEWER' }).select('-password -email');
        res.json(interviewers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/users/candidates
// @desc    Get list of candidates (for Recruiters)
router.get('/candidates', verifyToken, async (req, res) => {
    try {
        // Allow Recruiter and Admin
        if (req.user.role !== 'RECRUITER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const candidates = await User.find({ role: 'CANDIDATE' }).select('name email profilePicture');
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/users/:email
// @desc    Get public profile by email (Optional per requirement)
router.get('/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select('-password -email');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/users/resume
// @desc    Upload resume
router.post('/resume', verifyToken, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // URL to access the file
        const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Update User model with resumeUrl
        const user = await User.findByIdAndUpdate(req.user.id, { resumeUrl: resumeUrl }, { new: true });

        // Also update Profile if it exists (for backward compatibility or redundancy)
        if (user.profile) {
            const Profile = require('../models/Profile');
            await Profile.findByIdAndUpdate(user.profile, { resume: resumeUrl });
        }

        res.json({ resumeUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
