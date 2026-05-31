import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createQuiz, generateAIQuestions, suggestSubject } from '../../utils/api';

const emptyQuestion = () => ({
    questionText: '', options: ['', '', '', ''],
    correctAnswer: 0, explanation: '', difficulty: 'medium',
});

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const COURSE_OPTIONS = {
    'College 1st Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 2nd Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 3rd Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 4th Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
};

const isCollege = (cls) => cls?.startsWith('College');

const CreateQuiz = () => {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState({
        title: '', description: '', category: '', subject: '',
        duration: 30, difficulty: 'medium', isPublished: false,
        targetClass: '', course: '', section: '',
        quizType: 'dpp', startTime: '', expiryTime: '',
        attendanceEnabled: false,
    });
    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [loading, setLoading] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiLoading, setAiLoading] = useState(false);
    const [subjectLoading, setSubjectLoading] = useState(false);

    const updateQuestion = (i, field, val) => {
        const updated = [...questions];
        updated[i] = { ...updated[i], [field]: val };
        setQuestions(updated);
    };
    const updateOption = (qi, oi, val) => {
        const updated = [...questions];
        updated[qi].options[oi] = val;
        setQuestions(updated);
    };
    const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
    const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

    const handleSuggestSubject = async () => {
        if (!quiz.title && !quiz.category) return;
        setSubjectLoading(true);
        try {
            const { data } = await suggestSubject({ title: quiz.title, category: quiz.category });
            setQuiz((prev) => ({ ...prev, subject: data.subject }));
            toast.success(`Subject suggested: "${data.subject}"`);
        } catch { }
        finally { setSubjectLoading(false); }
    };

    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) return toast.error('Please enter a topic');
        setAiLoading(true);
        try {
            const { data } = await generateAIQuestions({ topic: aiTopic, count: aiCount, difficulty: quiz.difficulty });
            const hasBlank = questions.length === 1 && !questions[0].questionText;
            setQuestions(hasBlank ? data.questions : [...questions, ...data.questions]);
            toast.success(`✨ ${data.generated} questions generated!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI generation failed');
        } finally { setAiLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (questions.some((q) => !q.questionText || q.options.some((o) => !o)))
            return toast.error('Please fill all question fields');
        setLoading(true);
        try {
            await createQuiz({ ...quiz, questions });
            toast.success('Quiz created successfully!');
            navigate('/teacher/quizzes');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setLoading(false); }
    };

    return (
        <div style={s.page}>
            <h1 style={s.title}>Create New Quiz</h1>
            <form onSubmit={handleSubmit}>

                {/* Quiz Details */}
                <div style={s.card}>
                    <h2 style={s.sec}>Quiz Details</h2>
                    <div style={s.grid}>
                        <input style={s.input} placeholder="Quiz title *" value={quiz.title}
                            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                            onBlur={handleSuggestSubject} required />
                        <input style={s.input} placeholder="Category *" value={quiz.category}
                            onChange={(e) => setQuiz({ ...quiz, category: e.target.value })}
                            onBlur={handleSuggestSubject} required />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input style={{ ...s.input, flex: 1 }}
                                placeholder="Subject (AI will auto-fill)" value={subjectLoading ? 'Suggesting...' : quiz.subject}
                                onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })} />
                            <button type="button" onClick={handleSuggestSubject} style={s.suggestBtn} disabled={subjectLoading}>
                                🤖
                            </button>
                        </div>
                        <input style={s.input} type="number" placeholder="Duration (min)" value={quiz.duration}
                            onChange={(e) => setQuiz({ ...quiz, duration: e.target.value })} />
                        <select style={s.input} value={quiz.difficulty} onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value })}>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <select style={s.input} value={quiz.targetClass} onChange={(e) => setQuiz({ ...quiz, targetClass: e.target.value, course: '' })}>
                            <option value="">Target Class (optional)</option>
                            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {isCollege(quiz.targetClass) && (
                            <select style={s.input} value={quiz.course} onChange={(e) => setQuiz({ ...quiz, course: e.target.value })}>
                                <option value="">Select Course (optional)</option>
                                {(COURSE_OPTIONS[quiz.targetClass] || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        <input style={s.input} placeholder="Section (optional, e.g. A, B, Science)" value={quiz.section}
                            onChange={(e) => setQuiz({ ...quiz, section: e.target.value })} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                            <input type="checkbox" checked={quiz.isPublished}
                                onChange={(e) => setQuiz({ ...quiz, isPublished: e.target.checked })} />
                            Publish immediately
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                            <input type="checkbox" checked={quiz.attendanceEnabled}
                                onChange={(e) => setQuiz({ ...quiz, attendanceEnabled: e.target.checked })} />
                            Enable Attendance
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                            <input type="checkbox" checked={quiz.attendanceEnabled}
                                onChange={(e) => setQuiz({ ...quiz, attendanceEnabled: e.target.checked })} />
                            Enable Attendance
                        </label>
                    </div>

                    {/* Quiz Type & Scheduling */}
                    <div style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--bg)', borderRadius: '12px', border: '1.5px solid var(--border)' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.8rem' }}>📅 Quiz Type & Schedule</p>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {[{ val: 'dpp', label: '📝 DPP (Daily Practice)' }, { val: 'scheduled', label: '🗓️ Scheduled Test' }].map(opt => (
                                <label key={opt.val} onClick={() => setQuiz({ ...quiz, quizType: opt.val, startTime: '', expiryTime: '' })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', cursor: 'pointer', padding: '0.6rem 1.2rem', borderRadius: '10px', border: `2px solid ${quiz.quizType === opt.val ? 'var(--primary)' : 'var(--border)'}`, background: quiz.quizType === opt.val ? '#6366f115' : 'transparent', fontWeight: quiz.quizType === opt.val ? 700 : 400 }}>
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        <div style={s.grid}>
                            {quiz.quizType === 'scheduled' && (
                                <div>
                                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Start Date & Time *</label>
                                    <input style={s.input} type="datetime-local" value={quiz.startTime}
                                        onChange={(e) => setQuiz({ ...quiz, startTime: e.target.value })} />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                    {quiz.quizType === 'dpp' ? 'Expiry Date & Time (optional)' : 'Expiry Date & Time *'}
                                </label>
                                <input style={s.input} type="datetime-local" value={quiz.expiryTime}
                                    onChange={(e) => setQuiz({ ...quiz, expiryTime: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <textarea style={{ ...s.input, borderRadius: '12px', minHeight: 70, resize: 'vertical' }}
                        placeholder="Description" value={quiz.description}
                        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} />
                </div>

                {/* AI Generator */}
                <div style={s.aiCard}>
                    <h2 style={s.sec}>🤖 ChatGPT Question Generator</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Enter any topic — ChatGPT will automatically generate MCQ questions</p>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input style={{ ...s.input, flex: 2 }}
                            placeholder="Topic (e.g. Photosynthesis, React Hooks, World War 2...)"
                            value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAIGenerate())} />
                        <input
                            style={{ ...s.input, width: 90 }}
                            type="number"
                            min={1}
                            max={20}
                            placeholder="Count"
                            value={aiCount}
                            onChange={(e) => setAiCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                        />                        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleAIGenerate}
                            style={s.aiBtn} disabled={aiLoading}>
                            {aiLoading ? '⏳ Generating...' : '✨ Generate with ChatGPT'}
                        </motion.button>
                    </div>
                    {aiLoading && <p style={{ color: 'var(--primary)', marginTop: '0.8rem', fontWeight: 500 }}>
                        🧠 Generating questions with ChatGPT...
                    </p>}
                </div>

                {/* Questions */}
                <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={s.sec}>Questions ({questions.length})</h2>
                        <button type="button" onClick={addQuestion} style={s.addBtn}>+ Add Manually</button>
                    </div>
                    <AnimatePresence>
                        {questions.map((q, qi) => (
                            <motion.div key={qi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }} style={s.qCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Q{qi + 1}</span>
                                    {questions.length > 1 && (
                                        <button type="button" onClick={() => removeQuestion(qi)} style={s.removeBtn}>✕ Remove</button>
                                    )}
                                </div>
                                <input style={s.input} placeholder="Question text *" value={q.questionText}
                                    onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', margin: '0.8rem 0' }}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                                                onChange={() => updateQuestion(qi, 'correctAnswer', oi)} />
                                            <input style={{ ...s.input, flex: 1, borderColor: q.correctAnswer === oi ? '#10b981' : 'var(--border)' }}
                                                placeholder={`Option ${oi + 1} *`} value={opt}
                                                onChange={(e) => updateOption(qi, oi, e.target.value)} required />
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                                    ☝️ Select the correct answer using the radio button
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <input style={{ ...s.input, flex: 1 }} placeholder="Explanation (optional)" value={q.explanation}
                                        onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)} />
                                    <select style={s.input} value={q.difficulty}
                                        onChange={(e) => updateQuestion(qi, 'difficulty', e.target.value)}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} type="submit" style={s.submitBtn} disabled={loading}>
                    {loading ? 'Creating...' : '🚀 Create Quiz'}
                </motion.button>
            </form>
        </div>
    );
};

const s = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 900, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2rem' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' },
    aiCard: { background: 'linear-gradient(135deg,#6366f115,#06b6d415)', borderRadius: '16px', padding: '2rem', border: '2px solid var(--primary)', marginBottom: '1.5rem' },
    sec: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%' },
    suggestBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' },
    aiBtn: { background: 'linear-gradient(135deg,var(--primary),var(--secondary))', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
    addBtn: { background: '#10b98120', color: '#10b981', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
    qCard: { background: 'var(--bg)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--border)' },
    removeBtn: { background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' },
    submitBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '1rem 3rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', width: '100%', marginTop: '1rem', cursor: 'pointer' },
};

export default CreateQuiz;

