
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  scheduledTime: { type: Date, required: true },
  meetingId: { type: String, unique: true, required: true },
  status: {
    type: String,
    default: 'Scheduled',
    enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled']
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
