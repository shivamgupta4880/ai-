const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

// POST /api/quizzes
const createQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.create({ ...req.body, teacherId: req.user._id });
        res.status(201).json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/quizzes  (published, for students)
const getPublishedQuizzes = async (req, res) => {
    try {
        const { category, difficulty, subject, search, quizType } = req.query;
        const filter = { isPublished: true };
        if (category) filter.category = new RegExp(category, 'i');
        if (difficulty) filter.difficulty = difficulty;
        if (subject) filter.subject = new RegExp(subject, 'i');
        if (quizType) filter.quizType = quizType;
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { subject: new RegExp(search, 'i') },
                { category: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
            ];
        }
        const quizzes = await Quiz.find(filter)
            .populate('teacherId', 'name')
            .select('title category subject difficulty duration totalAttempts description teacherId createdAt questions quizType startTime expiryTime targetClass section')
            .sort({ createdAt: -1 })
            .lean();
        const result = quizzes.map(q => ({
            ...q,
            questionCount: q.questions?.length || 0,
            questions: undefined,
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTeacherQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ teacherId: req.user._id })
            .select('title category difficulty duration totalAttempts isPublished questions createdAt')
            .sort({ createdAt: -1 })
            .lean();
        const result = quizzes.map(q => ({ ...q, questionCount: q.questions?.length || 0, questions: undefined }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/quizzes/all  (admin)
const getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('teacherId', 'name email').sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/quizzes/:id
const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('teacherId', 'name');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Scheduling check for students
        if (req.user.role === 'student') {
            const now = new Date();
            if (quiz.quizType === 'scheduled' && quiz.startTime && now < new Date(quiz.startTime))
                return res.status(403).json({ message: 'Quiz has not started yet', startTime: quiz.startTime });
            if (quiz.expiryTime && now > new Date(quiz.expiryTime))
                return res.status(403).json({ message: 'Quiz has expired', expiryTime: quiz.expiryTime });
        }
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/quizzes/:id
const updateQuiz = async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? { _id: req.params.id }
            : { _id: req.params.id, teacherId: req.user._id };
        const quiz = await Quiz.findOneAndUpdate(filter, req.body, { new: true });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/quizzes/:id
const deleteQuiz = async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? { _id: req.params.id }
            : { _id: req.params.id, teacherId: req.user._id };
        await Quiz.findOneAndDelete(filter);
        res.json({ message: 'Quiz deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/quizzes/:id/analytics  (teacher)
const getQuizAnalytics = async (req, res) => {
    try {
        const attempts = await Attempt.find({ quizId: req.params.id }).populate('studentId', 'name email');
        const avgScore = attempts.length
            ? attempts.reduce((a, b) => a + b.score, 0) / attempts.length
            : 0;
        res.json({ attempts, avgScore: avgScore.toFixed(1), totalAttempts: attempts.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createQuiz, getPublishedQuizzes, getTeacherQuizzes,
    getAllQuizzes, getQuizById, updateQuiz, deleteQuiz, getQuizAnalytics,
};
