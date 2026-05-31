const express = require('express');
const router = express.Router();
const { submitAttempt, getMyAttempts, getMyAnalytics, getAttemptById, getResultsBySection } = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('student'), submitAttempt);
router.get('/my', protect, authorize('student'), getMyAttempts);
router.get('/my/analytics', protect, authorize('student'), getMyAnalytics);
router.get('/section', protect, authorize('admin', 'teacher'), getResultsBySection);
router.get('/:id', protect, getAttemptById);

module.exports = router;
