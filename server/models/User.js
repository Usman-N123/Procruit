
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Common Fields
  name: { type: String, required: true }, // Full name
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'ORG_ADMIN', 'RECRUITER', 'CANDIDATE', 'INTERVIEWER'],
    default: 'CANDIDATE'
  },

  // Organization Link (For Org Admin & Recruiters)
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  // Profile Link
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },

  // Freelancer Approval Status
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: function () {
      return this.role === 'INTERVIEWER' ? 'PENDING' : 'APPROVED';
    }
  },

  profilePicture: { type: String, default: null },
  resumeUrl: { type: String }, // Store resume URL directly on User model
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
