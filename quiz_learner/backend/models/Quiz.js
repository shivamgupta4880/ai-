const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // index of correct option
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
});

const quizSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        category: { type: String, required: true },
        subject: { type: String, default: '' },
        targetClass: { type: String, default: '' },
        section: { type: String, default: '' },
        course: { type: String, default: '' },
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        questions: [questionSchema],
        duration: { type: Number, default: 30 }, // minutes
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        isPublished: { type: Boolean, default: false },
        totalAttempts: { type: Number, default: 0 },
        // Quiz Type
        quizType: { type: String, enum: ['dpp', 'scheduled'], default: 'dpp' },
        // Scheduling
        startTime: { type: Date, default: null },
        expiryTime: { type: Date, default: null },
        scheduledAt: { type: Date, default: null },
        schedulingEnabled: { type: Boolean, default: false },
        // Attendance
        attendanceEnabled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
