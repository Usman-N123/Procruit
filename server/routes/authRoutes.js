const express = require('express');
const router = express.Router();
const {
  registerOrg,
  addRecruiter,
  registerFreelancer,
  registerCandidate,
  login
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Public Routes
router.post('/register-org', registerOrg);
router.post('/register-freelancer', registerFreelancer);
router.post('/register-candidate', registerCandidate);
router.post('/login', login);

// Protected Routes
// Only Org Admin can add recruiters
router.post('/register-recruiter', protect, checkRole('ORG_ADMIN'), addRecruiter);
router.get('/recruiters', protect, checkRole('ORG_ADMIN'), require('../controllers/authController').getRecruiters);
router.post('/change-password', protect, require('../controllers/authController').changePassword);

module.exports = router;
