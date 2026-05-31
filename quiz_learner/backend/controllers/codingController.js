const CodingChallenge = require('../models/CodingChallenge');
const CodingAttempt = require('../models/CodingAttempt');
const vm = require('vm');
const axios = require('axios');
const { ask } = require('../utils/groqClient');

// Judge0 language IDs
const LANG_IDS = {
    javascript: 63,  // Node.js 12.14.0
    python: 71,      // Python 3.8.1
    java: 62,        // Java (OpenJDK 13.0.1)
    cpp: 54,         // C++ (GCC 9.2.0)
};

const JUDGE0_URL = 'https://ce.judge0.com';

// Run code via Judge0 API
const runViaJudge0 = async (code, language, input = '', timeLimit = 5) => {
    const languageId = LANG_IDS[language];
    if (!languageId) return { output: '', error: `Language "${language}" not supported` };

    try {
        // Submit
        const submitRes = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
            source_code: code,
            language_id: languageId,
            stdin: input,
            cpu_time_limit: timeLimit,
            wall_time_limit: timeLimit + 5,
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        });

        const result = submitRes.data;
        const statusId = result.status?.id;

        // status 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = CE, 11-12 = RE
        if (statusId === 6) {
            // Compilation Error
            return { output: '', error: `Compilation Error:\n${result.compile_output || ''}` };
        }
        if (statusId === 5) {
            return { output: '', error: 'Time Limit Exceeded' };
        }
        if (statusId >= 7 && statusId <= 12) {
            return { output: '', error: `Runtime Error:\n${result.stderr || result.message || ''}` };
        }

        const output = result.stdout || '';
        const error = result.stderr || null;
        return { output: output.trim(), error: error ? error.trim() : null };
    } catch (err) {
        // Fallback to JS vm if Judge0 is down
        if (language === 'javascript') return runJS(code, input);
        return { output: '', error: 'Code execution service unavailable. Try again.' };
    }
};

// Safe JS code runner using vm sandbox (fallback)
const runJS = (code, input, timeLimit = 5000) => {
    return new Promise((resolve) => {
        try {
            const logs = [];
            const sandbox = {
                console: { log: (...args) => logs.push(args.map(String).join(' ')) },
                input,
                setTimeout: undefined, setInterval: undefined, fetch: undefined,
                require: undefined, process: undefined,
            };
            vm.createContext(sandbox);
            vm.runInContext(code, sandbox, { timeout: timeLimit });
            resolve({ output: logs.join('\n'), error: null });
        } catch (err) {
            resolve({ output: '', error: err.message });
        }
    });
};

// POST /api/coding/run — run code against visible test cases
const runCode = async (req, res) => {
    try {
        const { challengeId, code, language } = req.body;

        const challenge = await CodingChallenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

        const visibleTests = challenge.testCases.filter(t => !t.isHidden);
        const results = [];

        for (const tc of visibleTests) {
            const { output, error } = await runViaJudge0(code, language, tc.input, challenge.timeLimit);
            const passed = !error && output.trim() === tc.expectedOutput.trim();
            results.push({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: error ? error : output,
                passed,
            });
        }

        res.json({ results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/coding/submit — run against all test cases and save attempt
const submitCode = async (req, res) => {
    try {
        const { challengeId, code, language } = req.body;

        const challenge = await CodingChallenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

        let passed = 0;
        const total = challenge.testCases.length;
        const start = Date.now();

        for (const tc of challenge.testCases) {
            const { output, error } = await runViaJudge0(code, language, tc.input, challenge.timeLimit);
            if (!error && output.trim() === tc.expectedOutput.trim()) passed++;
        }

        const executionTime = Date.now() - start;
        const status = passed === total ? 'passed' : passed > 0 ? 'partial' : 'failed';

        const attempt = await CodingAttempt.create({
            studentId: req.user._id,
            challengeId,
            code,
            language,
            testsPassed: passed,
            totalTests: total,
            status,
            executionTime,
        });

        await CodingChallenge.findByIdAndUpdate(challengeId, { $inc: { totalAttempts: 1 } });
        res.status(201).json({ attempt, testsPassed: passed, totalTests: total, status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/coding — get published challenges
const getChallenges = async (req, res) => {
    try {
        const challenges = await CodingChallenge.find({ isPublished: true })
            .populate('teacherId', 'name')
            .select('-testCases -solution -starterCode')
            .sort({ createdAt: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/coding/teacher
const getTeacherChallenges = async (req, res) => {
    try {
        const challenges = await CodingChallenge.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/coding/:id
const getChallengeById = async (req, res) => {
    try {
        const challenge = await CodingChallenge.findById(req.params.id).populate('teacherId', 'name');
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
        if (req.user.role === 'student') {
            challenge.testCases = challenge.testCases.filter(t => !t.isHidden);
            challenge.solution = undefined;
        }
        res.json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/coding
const createChallenge = async (req, res) => {
    try {
        const challenge = await CodingChallenge.create({ ...req.body, teacherId: req.user._id });
        res.status(201).json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/coding/:id
const deleteChallenge = async (req, res) => {
    try {
        await CodingChallenge.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/coding/:id
const updateChallenge = async (req, res) => {
    try {
        const challenge = await CodingChallenge.findOneAndUpdate(
            { _id: req.params.id, teacherId: req.user._id },
            req.body, { new: true }
        );
        res.json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/coding/my-attempts
const getMyAttempts = async (req, res) => {
    try {
        const attempts = await CodingAttempt.find({ studentId: req.user._id })
            .populate('challengeId', 'title difficulty language')
            .sort({ createdAt: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { runCode, submitCode, getChallenges, getTeacherChallenges, getChallengeById, createChallenge, aiGenerateChallenge, deleteChallenge, updateChallenge, getMyAttempts };

// POST /api/coding/ai-generate — AI generates coding challenge
async function aiGenerateChallenge(req, res) {
    try {
        const { topic, difficulty = 'medium', language = 'javascript', targetClass = '' } = req.body;
        if (!topic?.trim()) return res.status(400).json({ message: 'Topic is required' });

        const prompt = `Generate 1 coding challenge on: "${topic}"
Language: ${language}, Difficulty: ${difficulty}${targetClass ? ', Level: ' + targetClass : ''}

Return ONLY a valid JSON object (no markdown):
{
  "title": "Challenge title",
  "description": "Clear problem description with input/output examples",
  "starterCode": "// Write your solution here\\n",
  "solution": "// complete working solution",
  "testCases": [
    {"input": "2 3", "expectedOutput": "5", "isHidden": false},
    {"input": "10 20", "expectedOutput": "30", "isHidden": false},
    {"input": "0 0", "expectedOutput": "0", "isHidden": true},
    {"input": "100 200", "expectedOutput": "300", "isHidden": true}
  ],
  "tags": ["tag1", "tag2"]
}`;

        const raw = await ask(prompt, 'You are an expert competitive programmer. Return only valid JSON object.');
        const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return res.status(500).json({ message: 'AI returned invalid format' });
        const challenge = JSON.parse(match[0]);
        res.json({ challenge, topic, difficulty, language });
    } catch (err) {
        console.error('[aiGenerateChallenge]', err.message);
        res.status(500).json({ message: err.message });
    }
}
