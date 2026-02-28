const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: {
        type: String,
        enum: ['Full-time', 'Contract', 'Part-time', 'Remote'],
        default: 'Full-time'
    },
    salary: { type: String },
    skills: [String],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
        type: String,
        enum: ['Active', 'Closed'],
        default: 'Active'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
