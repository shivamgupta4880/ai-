const Attendance = require('../models/Attendance');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// POST /api/attendance/mark — student marks own attendance (quiz-based)
const markAttendance = async (req, res) => {
    try {
        const { quizId } = req.body;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const today = new Date().toISOString().split('T')[0];
        const existing = await Attendance.findOne({ studentId: req.user._id, quizId });
        if (existing) return res.json({ message: 'Already marked', attendance: existing });

        const attendance = await Attendance.create({
            studentId: req.user._id,
            quizId,
            date: today,
            markedBy: 'student',
            status: 'present',
        });
        res.status(201).json(attendance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/attendance/teacher-mark — teacher marks single student
const teacherMarkAttendance = async (req, res) => {
    try {
        const { quizId, studentId, status } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOneAndUpdate(
            { studentId, quizId },
            { status, markedBy: 'teacher', date: today },
            { upsert: true, new: true }
        );
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/attendance/bulk — teacher marks attendance for whole class
const bulkMarkAttendance = async (req, res) => {
    try {
        const { date, subject, targetClass, section, records } = req.body;
        // records: [{ studentId, status, remark }]
        if (!date || !records?.length)
            return res.status(400).json({ message: 'Date and records required' });

        const ops = records.map(r => ({
            updateOne: {
                filter: { studentId: r.studentId, date, subject: subject || '', teacherId: req.user._id },
                update: {
                    $set: {
                        studentId: r.studentId,
                        teacherId: req.user._id,
                        date,
                        subject: subject || '',
                        targetClass: targetClass || '',
                        section: section || '',
                        status: r.status || 'present',
                        remark: r.remark || '',
                        markedBy: 'teacher',
                    }
                },
                upsert: true,
            }
        }));

        await Attendance.bulkWrite(ops);
        res.json({ message: 'Attendance saved', count: records.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/attendance/students?targetClass=&section= — teacher gets students list
const getStudentsByClass = async (req, res) => {
    try {
        const { targetClass, section } = req.query;
        const filter = { role: 'student', isActive: true };
        if (targetClass?.trim()) filter.studentClass = new RegExp(`^${targetClass.trim()}$`, 'i');
        if (section?.trim()) filter.section = new RegExp(`^${section.trim()}$`, 'i');
        const students = await User.find(filter).select('name email studentClass section').sort({ name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/attendance/report?date=&targetClass=&section=&subject= — teacher views report
const getAttendanceReport = async (req, res) => {
    try {
        const { date, targetClass, section, subject } = req.query;
        const filter = { teacherId: req.user._id };
        if (date?.trim()) filter.date = date.trim();
        if (targetClass?.trim()) filter.targetClass = new RegExp(`^${targetClass.trim()}$`, 'i');
        if (section?.trim()) filter.section = new RegExp(`^${section.trim()}$`, 'i');
        if (subject?.trim()) filter.subject = new RegExp(subject.trim(), 'i');

        const records = await Attendance.find(filter)
            .populate('studentId', 'name email studentClass')
            .sort({ date: -1, createdAt: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/attendance/my — student views own attendance
const getMyAttendanceFull = async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.user._id })
            .populate('teacherId', 'name')
            .sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/attendance/my/:quizId — student checks quiz attendance
const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findOne({
            studentId: req.user._id,
            quizId: req.params.quizId,
        });
        res.json(attendance || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/attendance/:quizId — teacher views quiz attendance
const getAttendanceByQuiz = async (req, res) => {
    try {
        const attendance = await Attendance.find({ quizId: req.params.quizId })
            .populate('studentId', 'name email studentClass')
            .sort({ createdAt: -1 });
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    markAttendance, teacherMarkAttendance, bulkMarkAttendance,
    getStudentsByClass, getAttendanceReport,
    getMyAttendanceFull, getMyAttendance, getAttendanceByQuiz,
};
