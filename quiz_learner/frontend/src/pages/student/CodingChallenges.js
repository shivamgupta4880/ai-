import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getChallenges } from '../../utils/api';
import Loader from '../../components/Loader';

const CodingChallenges = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        getChallenges().then(({ data }) => setChallenges(data)).finally(() => setLoading(false));
    }, []);

    const filtered = filter ? challenges.filter(c => c.difficulty === filter) : challenges;

    const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>💻 Coding Challenges</h1>
            <div style={styles.filters}>
                {['', 'easy', 'medium', 'hard'].map(d => (
                    <button key={d} onClick={() => setFilter(d)}
                        style={{ ...styles.filterBtn, background: filter === d ? 'var(--primary)' : 'var(--card)', color: filter === d ? '#fff' : 'var(--text)' }}>
                        {d || 'All'}
                    </button>
                ))}
            </div>
            {loading ? <Loader /> : (
                <div style={styles.grid}>
                    {filtered.map(c => (
                        <motion.div key={c._id} whileHover={{ y: -4 }} style={styles.card}>
                            <div style={styles.cardTop}>
                                <span style={{ ...styles.diffBadge, color: diffColor[c.difficulty], background: diffColor[c.difficulty] + '20' }}>{c.difficulty}</span>
                                <span style={styles.langBadge}>{c.language}</span>
                            </div>
                            <h3 style={styles.cardTitle}>{c.title}</h3>
                            <p style={styles.desc}>{c.description?.substring(0, 100)}...</p>
                            <div style={styles.meta}>
                                <span>🏆 {c.totalAttempts} attempts</span>
                                <span>By {c.teacherId?.name}</span>
                            </div>
                            <Link to={`/student/coding/${c._id}`} style={styles.startBtn}>Solve →</Link>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No challenges available.</p>}
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    filters: { display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' },
    filterBtn: { padding: '0.5rem 1.2rem', borderRadius: '20px', border: '1.5px solid var(--border)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
    card: { background: 'var(--card)', borderRadius: '20px', padding: '1.8rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    cardTop: { display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' },
    diffBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' },
    langBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' },
    desc: { fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 },
    meta: { display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' },
    startBtn: { display: 'block', background: 'var(--primary)', color: '#fff', padding: '0.7rem', borderRadius: '10px', fontWeight: 600, textAlign: 'center' },
};

export default CodingChallenges;
