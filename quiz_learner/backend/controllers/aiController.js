const { generateQuiz, generateMixedQuiz } = require('../utils/quizGenerator');
const { ask } = require('../utils/groqClient');

// POST /api/ai/generate-questions
const generateQuestions = async (req, res) => {
    try {
        const { topic, count = 5, difficulty = 'medium', type = 'mcq', subject, targetClass, language, shuffle } = req.body;
        if (!topic?.trim()) return res.status(400).json({ message: 'Topic is required' });
        const result = await generateQuiz({ topic, count, difficulty, type, subject, targetClass, language, shuffle });
        res.json(result);
    } catch (err) {
        console.error('[generateQuestions]', err.message);
        res.status(500).json({ message: err.message });
    }
};

// POST /api/ai/generate-mixed
const generateMixed = async (req, res) => {
    try {
        const { topic, easyCount, mediumCount, hardCount, subject, targetClass } = req.body;
        if (!topic?.trim()) return res.status(400).json({ message: 'Topic is required' });
        const result = await generateMixedQuiz({ topic, easyCount, mediumCount, hardCount, subject, targetClass });
        res.json(result);
    } catch (err) {
        console.error('[generateMixed]', err.message);
        res.status(500).json({ message: err.message });
    }
};

// POST /api/ai/suggest-subject
const suggestSubject = async (req, res) => {
    try {
        const { title, category } = req.body;
        if (!title?.trim() && !category?.trim()) return res.json({ subject: '' });
        const prompt = `Given a quiz titled "${title || category}" in category "${category || title}", suggest a specific subject name (2-4 words max). Return ONLY the subject name, nothing else.`;
        const subject = (await ask(prompt)).replace(/['"]/g, '').trim();
        res.json({ subject });
    } catch (err) {
        res.json({ subject: '' });
    }
};

// POST /api/ai/analyze-performance
const analyzePerformance = async (req, res) => {
    try {
        const { score, totalQuestions, weakTopics, category } = req.body;
        const pct = ((score / totalQuestions) * 100).toFixed(1);
        const prompt = `A student scored ${score}/${totalQuestions} (${pct}%) in a ${category || 'general'} quiz. Weak topics: ${weakTopics?.length ? weakTopics.join(', ') : 'none'}. Give a short encouraging 2-3 sentence personalized feedback with specific improvement tips.`;
        const feedback = await ask(prompt);
        const level = pct >= 85 ? 'excellent' : pct >= 65 ? 'good' : pct >= 40 ? 'average' : 'poor';
        res.json({ score: pct, level, feedback, message: `You answered ${score} out of ${totalQuestions} correctly.` });
    } catch (err) {
        const pct = ((req.body.score / req.body.totalQuestions) * 100).toFixed(1);
        const level = pct >= 85 ? 'excellent' : pct >= 65 ? 'good' : pct >= 40 ? 'average' : 'poor';
        res.json({ score: pct, level, feedback: `You scored ${pct}%. Keep practicing!`, message: '' });
    }
};

module.exports = { generateQuestions, generateMixed, suggestSubject, analyzePerformance };
