const { ask, extractJSON } = require('./groqClient');

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = ['mcq', 'truefalse', 'fillblank'];
const MAX_RETRIES = 3;

const DIFFICULTY_GUIDELINES = {
    easy: 'basic recall, simple concepts, straightforward answers',
    medium: 'application of concepts, moderate reasoning required',
    hard: 'deep analysis, complex reasoning, edge cases, advanced concepts',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const validateQuestion = (q, type = 'mcq') => {
    if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length < 5) return false;
    if (type === 'mcq') {
        if (!Array.isArray(q.options) || q.options.length !== 4) return false;
        if (q.options.some(o => !o || typeof o !== 'string' || o.trim().length === 0)) return false;
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
        const unique = new Set(q.options.map(o => o.toLowerCase().trim()));
        if (unique.size !== 4) return false;
    }
    if (type === 'truefalse') {
        if (typeof q.correctAnswer !== 'boolean' && q.correctAnswer !== 0 && q.correctAnswer !== 1) return false;
    }
    if (type === 'fillblank') {
        if (!q.answer || typeof q.answer !== 'string') return false;
    }
    return true;
};

const sanitizeQuestion = (q, type = 'mcq', difficulty = 'medium') => ({
    questionText: q.questionText?.trim(),
    options: type === 'mcq' ? q.options.map(o => o?.trim()) : undefined,
    correctAnswer: type === 'truefalse'
        ? (q.correctAnswer === true || q.correctAnswer === 1 ? 1 : 0)
        : q.correctAnswer,
    answer: type === 'fillblank' ? q.answer?.trim() : undefined,
    explanation: q.explanation?.trim() || '',
    difficulty: DIFFICULTY_LEVELS.includes(q.difficulty) ? q.difficulty : difficulty,
    type,
});

const buildMCQPrompt = ({ topic, count, difficulty, subject, targetClass, language }) =>
    `Generate exactly ${count} multiple choice questions on: "${topic}"
${subject ? `Subject: ${subject}` : ''}
${targetClass ? `Level: ${targetClass}` : ''}
Difficulty: ${difficulty} (${DIFFICULTY_GUIDELINES[difficulty]})
${language && language !== 'english' ? `Language: ${language}` : ''}

Return ONLY a valid JSON array, no extra text:
[{"questionText":"...?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"${difficulty}"}]

Rules: correctAnswer is 0-based index, all 4 options must be unique and plausible.`;

const buildTrueFalsePrompt = ({ topic, count, difficulty, subject, targetClass }) =>
    `Generate exactly ${count} True/False questions on: "${topic}"
${subject ? `Subject: ${subject}` : ''}
${targetClass ? `Level: ${targetClass}` : ''}
Difficulty: ${difficulty}

Return ONLY a valid JSON array:
[{"questionText":"Statement.","correctAnswer":true,"explanation":"...","difficulty":"${difficulty}"}]`;

const buildFillBlankPrompt = ({ topic, count, difficulty, subject, targetClass }) =>
    `Generate exactly ${count} fill-in-the-blank questions on: "${topic}"
${subject ? `Subject: ${subject}` : ''}
${targetClass ? `Level: ${targetClass}` : ''}
Difficulty: ${difficulty}

Return ONLY a valid JSON array:
[{"questionText":"The ___ is the powerhouse of the cell.","answer":"mitochondria","explanation":"...","difficulty":"${difficulty}"}]`;

const generateWithRetry = async (prompt, type, difficulty, expectedCount) => {
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const raw = await ask(prompt, 'You are an expert quiz creator. Return only valid JSON, no markdown.');
            const parsed = extractJSON(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty response');
            const valid = parsed.filter(q => validateQuestion(q, type)).map(q => sanitizeQuestion(q, type, difficulty));
            if (valid.length === 0) throw new Error('No valid questions after validation');
            return valid;
        } catch (err) {
            lastError = err;
            if (attempt < MAX_RETRIES) await sleep(800 * attempt);
        }
    }
    throw new Error(`Quiz generation failed: ${lastError?.message}`);
};

const generateQuiz = async ({
    topic, count = 5, difficulty = 'medium', type = 'mcq',
    subject = '', targetClass = '', language = 'english', shuffle = false,
} = {}) => {
    if (!topic?.trim()) throw new Error('Topic is required');
    const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 30);
    const safeDifficulty = DIFFICULTY_LEVELS.includes(difficulty) ? difficulty : 'medium';
    const safeType = QUESTION_TYPES.includes(type) ? type : 'mcq';
    const params = { topic: topic.trim(), count: safeCount, difficulty: safeDifficulty, subject: subject?.trim(), targetClass: targetClass?.trim(), language: language?.trim() || 'english' };

    let prompt;
    if (safeType === 'truefalse') prompt = buildTrueFalsePrompt(params);
    else if (safeType === 'fillblank') prompt = buildFillBlankPrompt(params);
    else prompt = buildMCQPrompt(params);

    let questions = await generateWithRetry(prompt, safeType, safeDifficulty, safeCount);
    questions = questions.slice(0, safeCount);
    if (shuffle) questions = questions.sort(() => Math.random() - 0.5);

    return { questions, meta: { topic: params.topic, subject: params.subject, targetClass: params.targetClass, difficulty: safeDifficulty, type: safeType, requested: safeCount, generated: questions.length } };
};

const generateMixedQuiz = async ({ topic, easyCount = 3, mediumCount = 4, hardCount = 3, subject = '', targetClass = '' } = {}) => {
    if (!topic) throw new Error('Topic is required');
    const [easy, medium, hard] = await Promise.all([
        easyCount > 0 ? generateQuiz({ topic, count: easyCount, difficulty: 'easy', subject, targetClass }) : { questions: [] },
        mediumCount > 0 ? generateQuiz({ topic, count: mediumCount, difficulty: 'medium', subject, targetClass }) : { questions: [] },
        hardCount > 0 ? generateQuiz({ topic, count: hardCount, difficulty: 'hard', subject, targetClass }) : { questions: [] },
    ]);
    const questions = [...easy.questions, ...medium.questions, ...hard.questions];
    return { questions, meta: { topic, subject, targetClass, type: 'mixed', generated: questions.length, breakdown: { easy: easy.questions.length, medium: medium.questions.length, hard: hard.questions.length } } };
};

module.exports = { generateQuiz, generateMixedQuiz, validateQuestion, sanitizeQuestion };
