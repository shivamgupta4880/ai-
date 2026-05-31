const express = require('express');
const router = express.Router();
const { generateQuestions, generateMixed, suggestSubject, analyzePerformance } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-questions', protect, generateQuestions);
router.post('/generate-mixed', protect, generateMixed);
router.post('/suggest-subject', protect, suggestSubject);
router.post('/analyze-performance', protect, analyzePerformance);

module.exports = router;
