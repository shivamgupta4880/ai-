const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Quiz-based attendance (existing)
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    // Standalone attendance
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    subject: { type: String, default: '' },
    targetClass: { type: String, default: '' },
    section: { type: String, default: '' },
    markedBy: { type: String, enum: ['student', 'teacher'], default: 'teacher' },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    remark: { type: String, default: '' },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1, subject: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
