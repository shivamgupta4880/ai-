const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
});

const codingChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    language: { type: String, enum: ['javascript', 'python', 'java', 'cpp'], default: 'javascript' },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
    testCases: [testCaseSchema],
    timeLimit: { type: Number, default: 5 }, // seconds
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
    targetClass: { type: String, default: '' },
    section: { type: String, default: '' },
    tags: [{ type: String }],
    totalAttempts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CodingChallenge', codingChallengeSchema);
