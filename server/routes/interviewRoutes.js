
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Interview = require('../models/Interview');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/authMiddleware');

// ============================
// Interview Routes
// ============================

// Schedule an Interview (Recruiter only)
router.post('/schedule', protect, authorize('RECRUITER'), async (req, res) => {
    try {
        const { candidateId, recruiterId, interviewerId, jobId, scheduledTime, notes, isDirectBooking } = req.body;

        // If it's a direct booking by recruiter to interviewer
        const interviewData = {
            recruiterId: req.user._id,
            candidateId: candidateId || req.user._id, // Fallback if not specified
            jobId: jobId || undefined,
            interviewerId: interviewerId || undefined,
            scheduledTime: new Date(scheduledTime),
            notes: notes || '',
        };

        // If it's an interviewer booking request, status is Pending and meetingId is generated later
        // For standard candidate interviews scheduling, meetingId is generated
        if (isDirectBooking) {
            interviewData.status = 'Pending';
            interviewData.meetingId = `temp-${uuidv4()}`; // Temporary ID until accepted
        } else {
            interviewData.meetingId = uuidv4();
            interviewData.status = 'Scheduled';
        }

        const newInterview = new Interview(interviewData);

        await newInterview.save();

        const populated = await Interview.findById(newInterview._id)
            .populate('candidateId', 'name email profilePicture')
            .populate('recruiterId', 'name email profilePicture')
            .populate('interviewerId', 'name email profilePicture')
            .populate('jobId', 'title company');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Schedule interview error:', err);
        res.status(500).json({ message: 'Failed to schedule interview' });
    }
});

// Get My Interviews (For Candidate, Recruiter, and Interviewer)
router.get('/my-interviews', protect, async (req, res) => {
    try {
        let query = {};
        const role = req.user.role;

        if (role === 'RECRUITER') {
            query = { recruiterId: req.user._id };
        } else if (role === 'CANDIDATE') {
            query = { candidateId: req.user._id };
        } else {
            // Interviewer or other roles — show interviews they're involved in
            // When a recruiter books an interviewer, they pass the interviewer as candidateId (or they might pass a real candidate and the interviewer is assigned).
            // Let's broaden the query so that if the logged-in user is the candidateId, recruiterId, OR if we had an interviewerId field. 
            // In our `POST /schedule` logic, direct bookings set candidateId = interviewer.
            query = {
                $or: [
                    { recruiterId: req.user._id },
                    { candidateId: req.user._id },
                    { interviewerId: req.user._id }
                ],
            };
        }

        const interviews = await Interview.find(query)
            .populate('candidateId', 'name email profilePicture')
            .populate('recruiterId', 'name email profilePicture')
            .populate('interviewerId', 'name email profilePicture')
            .populate('jobId', 'title company')
            .sort({ scheduledTime: -1 });

        res.json(interviews);
    } catch (err) {
        console.error('Fetch interviews error:', err);
        res.status(500).json({ message: 'Failed to fetch interviews' });
    }
});

// Get Single Interview (Room validation — checks user is a participant)
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Search by _id or meetingId
        let interview = await Interview.findOne({
            $or: [
                ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
                { meetingId: id },
            ],
        })
            .populate('candidateId', 'name email profilePicture')
            .populate('recruiterId', 'name email profilePicture')
            .populate('interviewerId', 'name email profilePicture')
            .populate('jobId', 'title company');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Validate the logged-in user is a participant
        const userId = req.user._id.toString();
        const isRecruiter = interview.recruiterId?._id?.toString() === userId;
        const isCandidate = interview.candidateId?._id?.toString() === userId;
        const isInterviewer = interview.interviewerId?._id?.toString() === userId || interview.interviewerId?.toString() === userId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isRecruiter && !isCandidate && !isInterviewer && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to join this interview' });
        }

        res.json(interview);
    } catch (err) {
        console.error('Fetch interview error:', err);
        res.status(500).json({ message: 'Failed to fetch interview' });
    }
});

// Update Interview Status
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Scheduled', 'InProgress', 'Completed', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Allow Interviewer (interviewerId in this context) to update status to Accepted/Rejected
        const userId = req.user._id.toString();
        const isRecruiter = interview.recruiterId.toString() === userId;
        const isCandidate = interview.candidateId.toString() === userId;
        const isInterviewer = interview.interviewerId?.toString() === userId;

        if (!isRecruiter && !isCandidate && !isInterviewer && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this interview' });
        }

        interview.status = status;

        // If accepted by an interviewer, schedule it and generate a meeting ID
        if (status === 'Accepted' && interview.meetingId.startsWith('temp-')) {
            interview.status = 'Scheduled';
            interview.meetingId = uuidv4();
        }

        await interview.save();

        const populated = await Interview.findById(interview._id)
            .populate('candidateId', 'name email profilePicture')
            .populate('recruiterId', 'name email profilePicture')
            .populate('interviewerId', 'name email profilePicture')
            .populate('jobId', 'title company');

        res.json(populated);
    } catch (err) {
        console.error('Update interview status error:', err);
        res.status(500).json({ message: 'Failed to update interview status' });
    }
});

// ============================
// Message Routes
// ============================

// Send a Message
router.post('/message', protect, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        const newMessage = new Message({
            senderId: req.user._id,
            receiverId,
            content,
        });

        await newMessage.save();
        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// Get Messages (Inbox)
router.get('/my-messages', protect, async (req, res) => {
    try {
        const messages = await Message.find({ receiverId: req.user._id })
            .populate('senderId', 'name role avatar companyName')
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

module.exports = router;
