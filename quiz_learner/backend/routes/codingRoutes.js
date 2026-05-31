const express = require('express');
const router = express.Router();
const {
    runCode, submitCode, getChallenges, getTeacherChallenges,
    getChallengeById, createChallenge, aiGenerateChallenge,
    deleteChallenge, updateChallenge, getMyAttempts
} = require('../controllers/codingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getChallenges);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherChallenges);
router.get('/my-attempts', protect, authorize('student'), getMyAttempts);
router.post('/', protect, authorize('teacher', 'admin'), createChallenge);
router.post('/ai-generate', protect, authorize('teacher', 'admin'), aiGenerateChallenge);
router.post('/run', protect, authorize('student'), runCode);
router.post('/submit', protect, authorize('student'), submitCode);
router.get('/:id', protect, getChallengeById);
router.put('/:id', protect, authorize('teacher', 'admin'), updateChallenge);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteChallenge);

module.exports = router;
