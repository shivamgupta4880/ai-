const express = require('express');
const router = express.Router();
const {
    markAttendance, teacherMarkAttendance, bulkMarkAttendance,
    getStudentsByClass, getAttendanceReport,
    getMyAttendanceFull, getMyAttendance, getAttendanceByQuiz,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, authorize('student'), markAttendance);
router.post('/teacher-mark', protect, authorize('teacher', 'admin'), teacherMarkAttendance);
router.post('/bulk', protect, authorize('teacher', 'admin'), bulkMarkAttendance);
router.get('/students', protect, authorize('teacher', 'admin'), getStudentsByClass);
router.get('/report', protect, authorize('teacher', 'admin'), getAttendanceReport);
router.get('/my', protect, authorize('student'), getMyAttendanceFull);
router.get('/my/:quizId', protect, authorize('student'), getMyAttendance);
router.get('/:quizId', protect, authorize('teacher', 'admin'), getAttendanceByQuiz);

module.exports = router;
