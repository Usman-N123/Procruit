const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: String }, // Snapshot of resume at time of application

    // Snapshots of Profile State
    experience: [],
    education: [],
    skills: [],

    status: {
        type: String,
        enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'],
        default: 'Applied'
    },
    appliedAt: { type: Date, default: Date.now }
});

// Prevent duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
