const express = require('express');
const router = express.Router();
const {
    createQuiz, getPublishedQuizzes, getTeacherQuizzes,
    getAllQuizzes, getQuizById, updateQuiz, deleteQuiz, getQuizAnalytics,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getPublishedQuizzes);
router.get('/all', protect, authorize('admin'), getAllQuizzes);
router.get('/teacher', protect, authorize('teacher'), getTeacherQuizzes);
router.post('/', protect, authorize('teacher'), createQuiz);
router.get('/:id', protect, getQuizById);
router.put('/:id', protect, authorize('teacher', 'admin'), updateQuiz);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteQuiz);
router.get('/:id/analytics', protect, authorize('teacher', 'admin'), getQuizAnalytics);

module.exports = router;
