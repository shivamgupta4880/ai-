const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetClass: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "10:00"
    room: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
