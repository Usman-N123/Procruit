const express = require('express');
const router = express.Router();
const multer = require('multer');
const { applyWithCV, getRankedCandidates, getMyApplications, retryAiAnalysis } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer in-memory storage for PDF uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
});

// POST /api/applications/:applicationId/retry-ai — Recruiter manually retries AI parsing
router.post('/:applicationId/retry-ai', protect, authorize('RECRUITER'), retryAiAnalysis);

// POST /api/applications/:jobId — Candidate applies with CV upload
router.post('/:jobId', protect, authorize('CANDIDATE'), applyWithCV);

// GET /api/applications/my-applications — Candidate views their applications
router.get('/my-applications', protect, authorize('CANDIDATE'), getMyApplications);

// GET /api/applications/:jobId/candidates — Recruiter views ranked candidates
router.get('/:jobId/candidates', protect, authorize('RECRUITER'), getRankedCandidates);

module.exports = router;
