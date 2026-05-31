import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getChallenges } from '../../utils/api';
import Loader from '../../components/Loader';

const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

const BrowseChallenges = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        getChallenges()
            .then(({ data }) => setChallenges(data))
            .catch(() => toast.error('Failed to load challenges'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? challenges : challenges.filter(c => c.difficulty === filter);

    if (loading) return <Loader />;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>💻 Coding Challenges</h1>
                    <p style={s.sub}>Solve problems, improve your coding skills</p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/student/coding-results" style={s.resultsBtn}>📊 My Results</Link>
                    <div style={s.filters}>
                        {['all', 'easy', 'medium', 'hard'].map(f => (
                            <button key={f} style={{ ...s.filterBtn, ...(filter === f ? { background: 'var(--primary)', color: '#fff' } : {}) }}
                                onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
                {['easy', 'medium', 'hard'].map(d => (
                    <div key={d} style={{ ...s.statCard, borderColor: DIFF_COLOR[d] }}>
                        <span style={{ color: DIFF_COLOR[d], fontWeight: 700, fontSize: '1.3rem' }}>
                            {challenges.filter(c => c.difficulty === d).length}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{d}</span>
                    </div>
                ))}
            </div>

            {/* Challenge List */}
            <div style={s.list}>
                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No challenges found.</p>}
                {filtered.map((c, i) => (
                    <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }} whileHover={{ x: 4 }} style={s.row}
                        onClick={() => navigate(`/student/coding/${c._id}`)}>
                        <div style={s.rowLeft}>
                            <span style={s.rowNum}>{i + 1}</span>
                            <div>
                                <div style={s.rowTitle}>{c.title}</div>
                                <div style={s.rowMeta}>
                                    {c.targetClass && <span style={s.metaBadge}>🎓 {c.targetClass}{c.section ? ` · ${c.section}` : ''}</span>}
                                    {c.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>👤 {c.teacherId?.name}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🏆 {c.totalAttempts} attempts</span>
                                </div>
                            </div>
                        </div>
                        <div style={s.rowRight}>
                            <span style={{ ...s.diffBadge, background: DIFF_COLOR[c.difficulty] + '20', color: DIFF_COLOR[c.difficulty] }}>{c.difficulty}</span>
                            <span style={s.langBadge}>{c.language}</span>
                            <span style={s.solveBtn}>Solve →</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const s = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1100, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' },
    sub: { color: 'var(--text-muted)', fontSize: '0.95rem' },
    filters: { display: 'flex', gap: '0.5rem' },
    filterBtn: { padding: '0.5rem 1.1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
    statsRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { flex: 1, background: 'var(--card)', border: '1.5px solid', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    row: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem', flexWrap: 'wrap' },
    rowLeft: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 },
    rowNum: { color: 'var(--text-muted)', fontWeight: 700, minWidth: 28, fontSize: '0.9rem' },
    rowTitle: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
    rowMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' },
    rowRight: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    diffBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' },
    langBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    tagBadge: { background: 'var(--border)', color: 'var(--text-muted)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem' },
    metaBadge: { background: '#6366f110', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem' },
    solveBtn: { color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' },
    resultsBtn: { background: '#6366f120', color: 'var(--primary)', border: '1.5px solid var(--primary)', padding: '0.5rem 1.1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' },
};

export default BrowseChallenges;

