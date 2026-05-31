const express = require('express');
const router = express.Router();
const { getTimetable, createEntry, deleteEntry, getTeachers } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'teacher'), getTimetable);
router.get('/teachers', protect, authorize('admin'), getTeachers);
router.post('/', protect, authorize('admin'), createEntry);
router.delete('/:id', protect, authorize('admin'), deleteEntry);

module.exports = router;
