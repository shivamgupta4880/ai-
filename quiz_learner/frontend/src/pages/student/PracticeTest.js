import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublishedQuizzes } from '../../utils/api';
import Loader from '../../components/Loader';

const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'Hindi', 'History', 'Geography', 'Science', 'Computer Science',
    'Economics', 'Political Science', 'Accountancy', 'Business Studies',
];

const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

const PracticeTest = () => {
    const [search, setSearch] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [diffFilter, setDiffFilter] = useState('all');

    const fetchPractice = async (q = search) => {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const { data } = await getPublishedQuizzes({ search: q, quizType: 'dpp' });
            setQuizzes(data);
        } catch { }
        finally { setLoading(false); }
    };

    // Quick subject click
    const handleSubjectClick = (sub) => {
        setSearch(sub);
        fetchPractice(sub);
    };

    const filtered = diffFilter === 'all' ? quizzes : quizzes.filter(q => q.difficulty === diffFilter);

    return (
        <div style={s.page}>
            {/* Hero */}
            <div style={s.hero}>
                <h1 style={s.heroTitle}>🎯 Practice Tests</h1>
                <p style={s.heroSub}>Search by subject name and start practicing instantly</p>

                {/* Search Bar */}
                <div style={s.searchWrap}>
                    <input
                        style={s.searchInput}
                        placeholder="Search subject (e.g. Mathematics, Physics, History...)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchPractice()}
                    />
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => fetchPractice()} style={s.searchBtn} disabled={loading}>
                        {loading ? '⏳' : '🔍 Search'}
                    </motion.button>
                </div>

                {/* Quick Subject Chips */}
                <div style={s.chips}>
                    {SUBJECTS.map(sub => (
                        <motion.button key={sub} whileTap={{ scale: 0.95 }} onClick={() => handleSubjectClick(sub)}
                            style={{ ...s.chip, ...(search === sub ? { background: 'var(--primary)', color: '#fff' } : {}) }}>
                            {sub}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {searched && (
                <div style={s.results}>
                    <div style={s.resultsHeader}>
                        <h2 style={s.resultsTitle}>
                            {loading ? 'Searching...' : `${filtered.length} Practice Tests Found`}
                            {search && <span style={s.searchTerm}> for "{search}"</span>}
                        </h2>
                        {!loading && quizzes.length > 0 && (
                            <div style={s.diffFilters}>
                                {['all', 'easy', 'medium', 'hard'].map(d => (
                                    <button key={d} onClick={() => setDiffFilter(d)}
                                        style={{ ...s.diffBtn, ...(diffFilter === d ? { background: d === 'all' ? 'var(--primary)' : DIFF_COLOR[d], color: '#fff' } : {}) }}>
                                        {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading ? <Loader /> : (
                        <AnimatePresence>
                            {filtered.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.empty}>
                                    <div style={{ fontSize: '3rem' }}>📚</div>
                                    <p>No practice tests found for "{search}"</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Try a different subject name or ask your teacher to add practice tests.</p>
                                </motion.div>
                            ) : (
                                <div style={s.grid}>
                                    {filtered.map((q, i) => (
                                        <motion.div key={q._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }} whileHover={{ y: -5 }} style={s.card}>
                                            {/* Top */}
                                            <div style={s.cardTop}>
                                                <span style={s.subjectBadge}>{q.subject || q.category}</span>
                                                <span style={{ ...s.diffBadge, background: DIFF_COLOR[q.difficulty] + '20', color: DIFF_COLOR[q.difficulty] }}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                            <h3 style={s.cardTitle}>{q.title}</h3>
                                            <p style={s.cardDesc}>{q.description || 'Practice your knowledge with this test.'}</p>
                                            <div style={s.cardMeta}>
                                                <span>📝 {q.questionCount} questions</span>
                                                <span>⏱ {q.duration} min</span>
                                                <span>🏆 {q.totalAttempts} attempts</span>
                                            </div>
                                            {q.targetClass && (
                                                <div style={s.classMeta}>
                                                    🎓 {q.targetClass}{q.section ? ` · ${q.section}` : ''}
                                                </div>
                                            )}
                                            <p style={s.teacher}>By {q.teacherId?.name || 'Teacher'}</p>
                                            <Link to={`/student/attempt/${q._id}`} style={s.startBtn}>
                                                ▶ Start Practice
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            )}

            {/* Default state */}
            {!searched && (
                <div style={s.defaultState}>
                    <div style={s.featureGrid}>
                        {[
                            { icon: '🔍', title: 'Search by Subject', desc: 'Type any subject name to find practice tests' },
                            { icon: '⚡', title: 'Quick Start', desc: 'Click subject chips above for instant search' },
                            { icon: '📊', title: 'Track Progress', desc: 'All attempts saved to your dashboard' },
                            { icon: '🎯', title: 'DPP Practice', desc: 'Daily practice problems added by teachers' },
                        ].map(f => (
                            <div key={f.title} style={s.featureCard}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>{f.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    page: { maxWidth: 1200, margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)' },
    hero: { background: 'linear-gradient(135deg, #6366f115, #06b6d415)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', border: '1px solid var(--border)', textAlign: 'center' },
    heroTitle: { fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' },
    heroSub: { color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' },
    searchWrap: { display: 'flex', gap: '0.8rem', maxWidth: 600, margin: '0 auto 1.5rem', flexWrap: 'wrap' },
    searchInput: { flex: 1, padding: '0.9rem 1.2rem', borderRadius: '12px', border: '2px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '1rem', minWidth: 200 },
    searchBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', whiteSpace: 'nowrap' },
    chips: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' },
    chip: { padding: '0.4rem 1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' },
    results: { marginTop: '1rem' },
    resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    resultsTitle: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' },
    searchTerm: { color: 'var(--primary)' },
    diffFilters: { display: 'flex', gap: '0.4rem' },
    diffBtn: { padding: '0.4rem 1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.82rem' },
    empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' },
    card: { background: 'var(--card)', borderRadius: '20px', padding: '1.8rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' },
    subjectBadge: { background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    diffBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' },
    cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' },
    cardDesc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 },
    cardMeta: { display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', flexWrap: 'wrap' },
    classMeta: { fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.4rem' },
    teacher: { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' },
    startBtn: { display: 'block', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, textAlign: 'center', fontSize: '0.95rem' },
    defaultState: { marginTop: '1rem' },
    featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' },
    featureCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' },
};

export default PracticeTest;

