const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    company: String,
    designation: String,
    from: String,
    to: String,
    work: String
}, { _id: false });

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String },
    bio: { type: String },
    skills: [String],
    experience: [experienceSchema],
    education: [{
        institution: String,
        degree: String,
        fieldOfStudy: String,
        from: String,
        to: String
    }],
    resume: { type: String }, // URL or base64

    // Interviewer Specific
    hourlyRate: { type: String },
    yearsOfExperience: { type: String },
    availability: { type: String } // e.g. "Weekdays", "20hrs/week"
});

module.exports = mongoose.model('Profile', profileSchema);
