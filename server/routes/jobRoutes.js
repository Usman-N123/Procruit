const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, applyJob, getMyJobs, updateApplicationStatus, getMyReceivedApplications } = require('../controllers/jobController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getJobs); // Public but reads user if logged in
router.get('/my-jobs', protect, authorize('RECRUITER'), getMyJobs);
router.get('/:id', getJobById); // Public
router.post('/', protect, authorize('RECRUITER', 'ORG_ADMIN'), createJob);
router.post('/:id/apply', protect, authorize('CANDIDATE'), applyJob);
router.put('/applications/:id/status', protect, authorize('RECRUITER'), updateApplicationStatus);
router.get('/applications/received', protect, authorize('RECRUITER'), getMyReceivedApplications);

module.exports = router;
