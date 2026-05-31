import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { createChallenge, getTeacherChallenges, deleteChallenge } from '../../utils/api';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const emptyTC = () => ({ input: '', expectedOutput: '', isHidden: false });

const emptyForm = () => ({
    title: '', description: '', difficulty: 'medium', language: 'javascript',
    starterCode: '', solution: '', timeLimit: 5,
    targetClass: '', section: '', tags: '', isPublished: false,
    testCases: [emptyTC()],
});

const CreateChallenge = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editorTab, setEditorTab] = useState('starter'); // starter | solution

    const fetchChallenges = () => {
        getTeacherChallenges().then(({ data }) => setChallenges(data)).finally(() => setLoading(false));
    };
    useEffect(() => { fetchChallenges(); }, []);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const updateTC = (i, key, val) => {
        const tcs = [...form.testCases];
        tcs[i] = { ...tcs[i], [key]: val };
        set('testCases', tcs);
    };
    const addTC = () => set('testCases', [...form.testCases, emptyTC()]);
    const removeTC = (i) => set('testCases', form.testCases.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) return toast.error('Title and description required');
        if (form.testCases.some(tc => !tc.expectedOutput)) return toast.error('All test cases need expected output');
        setSaving(true);
        try {
            const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            await createChallenge({ ...form, tags });
            toast.success('Challenge created!');
            setForm(emptyForm());
            setShowForm(false);
            fetchChallenges();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this challenge?')) return;
        try {
            await deleteChallenge(id);
            setChallenges(prev => prev.filter(c => c._id !== id));
            toast.success('Deleted');
        } catch { toast.error('Delete failed'); }
    };

    if (loading) return <Loader />;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <h1 style={s.title}>💻 Coding Challenges</h1>
                <button onClick={() => setShowForm(!showForm)} style={s.toggleBtn}>
                    {showForm ? '✕ Cancel' : '+ Create Challenge'}
                </button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={s.card}>
                    <form onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <h2 style={s.sec}>Challenge Details</h2>
                        <div style={s.grid}>
                            <input style={s.input} placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} required />
                            <select style={s.input} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            <select style={s.input} value={form.language} onChange={e => set('language', e.target.value)}>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                            <input style={s.input} type="number" placeholder="Time Limit (sec)" value={form.timeLimit} onChange={e => set('timeLimit', e.target.value)} min={1} max={30} />
                            <select style={s.input} value={form.targetClass} onChange={e => set('targetClass', e.target.value)}>
                                <option value="">Target Class (optional)</option>
                                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input style={s.input} placeholder="Section (optional, e.g. A, B)" value={form.section} onChange={e => set('section', e.target.value)} />
                            <input style={s.input} placeholder="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} />
                            <label style={s.checkLabel}>
                                <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />
                                Publish immediately
                            </label>
                        </div>
                        <textarea style={s.textarea} placeholder="Problem description * (explain the problem clearly with examples)" value={form.description} onChange={e => set('description', e.target.value)} required />

                        {/* Code Editors */}
                        <h2 style={{ ...s.sec, marginTop: '1.5rem' }}>Code</h2>
                        <div style={s.editorTabs}>
                            <button type="button" style={{ ...s.edTab, ...(editorTab === 'starter' ? s.edTabActive : {}) }} onClick={() => setEditorTab('starter')}>Starter Code</button>
                            <button type="button" style={{ ...s.edTab, ...(editorTab === 'solution' ? s.edTabActive : {}) }} onClick={() => setEditorTab('solution')}>Solution (hidden)</button>
                        </div>
                        <div style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden', border: '1px solid #333' }}>
                            {editorTab === 'starter' ? (
                                <Editor height="200px" language={form.language} value={form.starterCode}
                                    onChange={val => set('starterCode', val || '')} theme="vs-dark"
                                    options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 10 } }} />
                            ) : (
                                <Editor height="200px" language={form.language} value={form.solution}
                                    onChange={val => set('solution', val || '')} theme="vs-dark"
                                    options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 10 } }} />
                            )}
                        </div>

                        {/* Test Cases */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
                            <h2 style={s.sec}>Test Cases</h2>
                            <button type="button" onClick={addTC} style={s.addBtn}>+ Add Test Case</button>
                        </div>
                        {form.testCases.map((tc, i) => (
                            <div key={i} style={s.tcCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>Case {i + 1}</span>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={tc.isHidden} onChange={e => updateTC(i, 'isHidden', e.target.checked)} />
                                            Hidden
                                        </label>
                                        {form.testCases.length > 1 && (
                                            <button type="button" onClick={() => removeTC(i)} style={s.removeBtn}>✕</button>
                                        )}
                                    </div>
                                </div>
                                <div style={s.tcGrid}>
                                    <div>
                                        <label style={s.tcLabel}>Input (optional)</label>
                                        <textarea style={s.tcInput} placeholder="e.g. 5\n3 1 4 1 5" value={tc.input} onChange={e => updateTC(i, 'input', e.target.value)} rows={3} />
                                    </div>
                                    <div>
                                        <label style={s.tcLabel}>Expected Output *</label>
                                        <textarea style={s.tcInput} placeholder="e.g. 14" value={tc.expectedOutput} onChange={e => updateTC(i, 'expectedOutput', e.target.value)} rows={3} required />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <motion.button whileTap={{ scale: 0.97 }} type="submit" style={s.submitBtn} disabled={saving}>
                            {saving ? 'Creating...' : '🚀 Create Challenge'}
                        </motion.button>
                    </form>
                </motion.div>
            )}

            {/* Challenges List */}
            <h2 style={{ ...s.sec, marginTop: '2rem' }}>My Challenges ({challenges.length})</h2>
            <div style={s.list}>
                {challenges.map(c => (
                    <motion.div key={c._id} whileHover={{ x: 3 }} style={s.row}>
                        <div>
                            <div style={s.rowTitle}>{c.title}</div>
                            <div style={s.rowMeta}>
                                <span style={{ color: c.difficulty === 'easy' ? '#10b981' : c.difficulty === 'medium' ? '#f59e0b' : '#ef4444', fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize' }}>{c.difficulty}</span>
                                <span style={s.langBadge}>{c.language}</span>
                                {c.targetClass && <span style={s.classBadge}>{c.targetClass}{c.section ? ` · ${c.section}` : ''}</span>}
                                <span style={{ color: c.isPublished ? '#10b981' : '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>{c.isPublished ? '✅ Published' : '📝 Draft'}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🏆 {c.totalAttempts} attempts</span>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(c._id)} style={s.deleteBtn}>🗑 Delete</button>
                    </motion.div>
                ))}
                {challenges.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No challenges yet.</p>}
            </div>
        </div>
    );
};

const s = {
    page: { padding: '2rem 3rem', maxWidth: 1000, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    toggleBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', marginBottom: '2rem' },
    sec: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
    textarea: { width: '100%', minHeight: 120, padding: '0.9rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.5rem', boxSizing: 'border-box' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.95rem', cursor: 'pointer' },
    editorTabs: { display: 'flex', gap: '0', borderRadius: '10px 10px 0 0', overflow: 'hidden', border: '1px solid #333', borderBottom: 'none' },
    edTab: { flex: 1, padding: '0.6rem', background: '#2d2d2d', color: '#aaa', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' },
    edTabActive: { background: '#1e1e1e', color: '#fff', fontWeight: 700 },
    addBtn: { background: '#10b98120', color: '#10b981', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
    tcCard: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.8rem' },
    tcGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    tcLabel: { display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' },
    tcInput: { width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' },
    removeBtn: { background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' },
    submitBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', width: '100%', marginTop: '1.5rem', cursor: 'pointer' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    row: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    rowTitle: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
    rowMeta: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' },
    langBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    classBadge: { background: '#06b6d420', color: '#06b6d4', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    deleteBtn: { background: '#ef444420', color: '#ef4444', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' },
};

export default CreateChallenge;
