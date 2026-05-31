const mongoose = require('mongoose');

const codingAttemptSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge', required: true },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    testsPassed: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    status: { type: String, enum: ['passed', 'failed', 'error', 'partial'], default: 'failed' },
    output: { type: String, default: '' },
    executionTime: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CodingAttempt', codingAttemptSchema);
