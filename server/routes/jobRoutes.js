const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, applyJob, getMyJobs, updateApplicationStatus, getMyReceivedApplications } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getJobs); // Public
router.get('/my-jobs', protect, authorize('RECRUITER'), getMyJobs);
router.get('/:id', getJobById); // Public
router.post('/', protect, authorize('RECRUITER', 'ORG_ADMIN'), createJob);
router.post('/:id/apply', protect, authorize('CANDIDATE'), applyJob);
router.put('/applications/:id/status', protect, authorize('RECRUITER'), updateApplicationStatus);
router.get('/applications/received', protect, authorize('RECRUITER'), getMyReceivedApplications);

module.exports = router;
