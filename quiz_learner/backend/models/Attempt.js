const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
        answers: [{ type: Number }], // selected option indexes
        score: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        timeTaken: { type: Number, default: 0 }, // seconds
        aiFeedback: { type: String, default: '' },
        weakTopics: [{ type: String }],
        performanceLevel: {
            type: String,
            enum: ['excellent', 'good', 'average', 'poor'],
            default: 'average',
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model('Attempt', attemptSchema);