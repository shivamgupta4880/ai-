import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createQuiz, generateAIQuestions } from '../../utils/api';

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
    'History', 'Geography', 'Science', 'Computer Science', 'Economics',
    'Political Science', 'Accountancy', 'Business Studies',
];

const emptyQ = () => ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });

const AddPracticeQuiz = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: details, 2: questions
    const [meta, setMeta] = useState({ subject: '', targetClass: '', section: '', title: '', duration: 20, difficulty: 'medium' });
    const [questions, setQuestions] = useState([emptyQ()]);
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiLoading, setAiLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const setM = (k, v) => setMeta(m => ({ ...m, [k]: v }));

    const handleNext = () => {
        if (!meta.subject || !meta.targetClass || !meta.title)
            return toast.error('Fill subject, class and title');
        setStep(2);
    };

    const updateQ = (i, k, v) => { const q = [...questions]; q[i] = { ...q[i], [k]: v }; setQuestions(q); };
    const updateOpt = (qi, oi, v) => { const q = [...questions]; q[qi].options[oi] = v; setQuestions(q); };

    const handleAI = async () => {
        const topic = aiTopic || `${meta.subject} for ${meta.targetClass}`;
        setAiLoading(true);
        try {
            const { data } = await generateAIQuestions({ topic, count: aiCount, difficulty: meta.difficulty });
            const blank = questions.length === 1 && !questions[0].questionText;
            setQuestions(blank ? data.questions : [...questions, ...data.questions]);
            toast.success(`${data.generated} questions generated!`);
        } catch (err) { toast.error(err.response?.data?.message || 'AI failed'); }
        finally { setAiLoading(false); }
    };

    const handleSave = async (publish) => {
        if (questions.some(q => !q.questionText || q.options.some(o => !o)))
            return toast.error('Fill all question fields');
        setSaving(true);
        try {
            await createQuiz({
                title: meta.title,
                description: `Practice test for ${meta.subject} — ${meta.targetClass}`,
                category: meta.subject,
                subject: meta.subject,
                targetClass: meta.targetClass,
                section: meta.section,
                duration: meta.duration,
                difficulty: meta.difficulty,
                quizType: 'dpp',
                isPublished: publish,
                questions,
            });
            toast.success(publish ? 'Practice quiz published!' : 'Saved as draft!');
            navigate('/teacher/quizzes');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>🎯 Add Practice Quiz</h1>
                    <p style={s.sub}>Create subject-wise DPP for students to practice</p>
                </div>
                <div style={s.steps}>
                    {[1, 2].map(n => (
                        <div key={n} style={{ ...s.step, background: step >= n ? 'var(--primary)' : 'var(--border)', color: step >= n ? '#fff' : 'var(--text-muted)' }}>
                            {n}
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1 — Details */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={s.card}>
                        <h2 style={s.sec}>📚 Quiz Details</h2>
                        <div style={s.grid}>
                            <div>
                                <label style={s.label}>Subject *</label>
                                <input style={s.input} list="subjects" placeholder="e.g. Mathematics" value={meta.subject}
                                    onChange={e => setM('subject', e.target.value)} />
                                <datalist id="subjects">
                                    {SUBJECTS.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label style={s.label}>Class *</label>
                                <select style={s.input} value={meta.targetClass} onChange={e => setM('targetClass', e.target.value)}>
                                    <option value="">Select Class</option>
                                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Section (optional)</label>
                                <input style={s.input} placeholder="e.g. A, B, Science" value={meta.section}
                                    onChange={e => setM('section', e.target.value)} />
                            </div>
                            <div>
                                <label style={s.label}>Quiz Title *</label>
                                <input style={s.input} placeholder="e.g. Algebra Practice Set 1" value={meta.title}
                                    onChange={e => setM('title', e.target.value)} />
                            </div>
                            <div>
                                <label style={s.label}>Duration (min)</label>
                                <input style={s.input} type="number" min={5} max={120} value={meta.duration}
                                    onChange={e => setM('duration', e.target.value)} />
                            </div>
                            <div>
                                <label style={s.label}>Difficulty</label>
                                <select style={s.input} value={meta.difficulty} onChange={e => setM('difficulty', e.target.value)}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} style={s.nextBtn}>
                            Next: Add Questions →
                        </motion.button>
                    </motion.div>
                )}

                {/* STEP 2 — Questions */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {/* Summary bar */}
                        <div style={s.summaryBar}>
                            <span style={s.summaryItem}>📚 {meta.subject}</span>
                            <span style={s.summaryItem}>🎓 {meta.targetClass}{meta.section ? ` · ${meta.section}` : ''}</span>
                            <span style={s.summaryItem}>⏱ {meta.duration} min</span>
                            <span style={s.summaryItem}>📝 {questions.length} questions</span>
                            <button onClick={() => setStep(1)} style={s.editBtn}>✏️ Edit Details</button>
                        </div>

                        {/* AI Generator */}
                        <div style={s.aiCard}>
                            <h3 style={s.sec}>🤖 Generate with AI</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                                AI will auto-generate MCQ questions for <strong>{meta.subject}</strong> — {meta.targetClass}
                            </p>
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input style={{ ...s.input, flex: 2 }} placeholder={`Topic (default: ${meta.subject} for ${meta.targetClass})`}
                                    value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                                <input style={{ ...s.input, width: 80 }} type="number" min={1} max={20} value={aiCount}
                                    onChange={e => setAiCount(Math.min(20, Math.max(1, Number(e.target.value))))} />
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAI} style={s.aiBtn} disabled={aiLoading}>
                                    {aiLoading ? '⏳ Generating...' : '✨ Generate'}
                                </motion.button>
                            </div>
                        </div>

                        {/* Questions */}
                        <div style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h2 style={s.sec}>Questions ({questions.length})</h2>
                                <button onClick={() => setQuestions([...questions, emptyQ()])} style={s.addBtn}>+ Add Question</button>
                            </div>
                            {questions.map((q, qi) => (
                                <div key={qi} style={s.qCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Q{qi + 1}</span>
                                        {questions.length > 1 && (
                                            <button onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}
                                                style={s.removeBtn}>✕ Remove</button>
                                        )}
                                    </div>
                                    <input style={s.input} placeholder="Question text *" value={q.questionText}
                                        onChange={e => updateQ(qi, 'questionText', e.target.value)} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', margin: '0.8rem 0' }}>
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                                                    onChange={() => updateQ(qi, 'correctAnswer', oi)} />
                                                <input style={{ ...s.input, flex: 1, borderColor: q.correctAnswer === oi ? '#10b981' : 'var(--border)' }}
                                                    placeholder={`Option ${oi + 1}`} value={opt}
                                                    onChange={e => updateOpt(qi, oi, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                    <input style={s.input} placeholder="Explanation (optional)" value={q.explanation}
                                        onChange={e => updateQ(qi, 'explanation', e.target.value)} />
                                </div>
                            ))}
                        </div>

                        {/* Save Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave(true)} style={s.publishBtn} disabled={saving}>
                                {saving ? 'Saving...' : '🚀 Publish Practice Quiz'}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave(false)} style={s.draftBtn} disabled={saving}>
                                💾 Save as Draft
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const s = {
    page: { padding: '2rem 3rem', maxWidth: 900, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' },
    sub: { color: 'var(--text-muted)', fontSize: '0.9rem' },
    steps: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
    step: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    aiCard: { background: 'linear-gradient(135deg,#6366f115,#06b6d415)', borderRadius: '16px', padding: '1.8rem', border: '2px solid var(--primary)', marginBottom: '1.5rem' },
    sec: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    label: { display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
    nextBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
    summaryBar: { display: 'flex', gap: '0.8rem', padding: '0.8rem 1.2rem', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' },
    summaryItem: { background: '#6366f115', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 },
    editBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', marginLeft: 'auto' },
    aiBtn: { background: 'linear-gradient(135deg,var(--primary),var(--secondary))', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
    addBtn: { background: '#10b98120', color: '#10b981', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
    qCard: { background: 'var(--bg)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem', border: '1px solid var(--border)' },
    removeBtn: { background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem' },
    publishBtn: { flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' },
    draftBtn: { background: 'var(--card)', color: 'var(--text)', border: '2px solid var(--border)', padding: '0.9rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' },
};

export default AddPracticeQuiz;
