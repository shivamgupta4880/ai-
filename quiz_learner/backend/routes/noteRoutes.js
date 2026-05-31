const express = require('express');
const router = express.Router();
const {
    getNotesForStudent, getTeacherNotes, createNote,
    deleteNote, setStudentClass, aiGenerateNote, uploadPDF,
} = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, authorize('student'), getNotesForStudent);
router.get('/teacher', protect, authorize('teacher'), getTeacherNotes);
router.post('/', protect, authorize('teacher'), createNote);
router.post('/upload-pdf', protect, authorize('teacher'), upload.single('pdf'), uploadPDF);
router.delete('/:id', protect, authorize('teacher'), deleteNote);
router.post('/ai-generate', protect, authorize('teacher'), aiGenerateNote);
router.put('/set-class', protect, authorize('student'), setStudentClass);

module.exports = router;
