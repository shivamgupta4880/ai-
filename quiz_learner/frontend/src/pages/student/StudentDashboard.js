import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyAttempts, getPublishedQuizzes, getMyCodingAttempts } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

// Skeleton shimmer for fast perceived loading
const Skeleton = ({ w = '100%', h = 20, r = 8 }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, var(--border) 25%, var(--card) 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [quizCount, setQuizCount] = useState(0);
    const [codingAttempts, setCodingAttempts] = useState([]);
    const [attemptsLoaded, setAttemptsLoaded] = useState(false);
    const [quizzesLoaded, setQuizzesLoaded] = useState(false);
    const [codingLoaded, setCodingLoaded] = useState(false);

    useEffect(() => {
        getMyAttempts()
            .then(({ data }) => setAttempts(data))
            .catch(() => { })
            .finally(() => setAttemptsLoaded(true));

        getPublishedQuizzes()
            .then(({ data }) => setQuizCount(data.length))
            .catch(() => { })
            .finally(() => setQuizzesLoaded(true));

        getMyCodingAttempts()
            .then(({ data }) => setCodingAttempts(data))
            .catch(() => { })
            .finally(() => setCodingLoaded(true));
    }, []);

    const avgScore = attempts.length
        ? (attempts.reduce((a, b) => a + b.score, 0) / attempts.length).toFixed(1)
        : 0;
    const attempted = new Set(attempts.map((a) => a.quizId?._id)).size;

    return (
        <div style={styles.page}>
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                <h1 style={styles.title}>Hello, {user?.name} 👋</h1>
                <p style={styles.sub}>Keep learning and improving every day!</p>

                {/* Stats — show skeleton until attempts loaded */}
                <div style={styles.grid}>
                    {attemptsLoaded ? (
                        <>
                            <StatCard icon="🏆" label="Total Attempts" value={attempts.length} color="#6366f1" />
                            <StatCard icon="📊" label="Avg Score" value={`${avgScore}%`} color="#10b981" />
                            <StatCard icon="📝" label="Quizzes Attempted" value={attempted} color="#f59e0b" />
                        </>
                    ) : (
                        [1, 2, 3].map((i) => (
                            <div key={i} style={styles.skeletonCard}>
                                <Skeleton w={48} h={48} r={12} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Skeleton h={28} r={6} />
                                    <Skeleton w="60%" h={14} r={4} />
                                </div>
                            </div>
                        ))
                    )}
                    {quizzesLoaded
                        ? <StatCard icon="📚" label="Available Quizzes" value={quizCount} color="#06b6d4" />
                        : <div style={styles.skeletonCard}><Skeleton w={48} h={48} r={12} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={28} r={6} /><Skeleton w="60%" h={14} r={4} /></div></div>
                    }
                </div>

                <div style={styles.actions}>
                    <Link to="/student/quizzes" style={styles.primaryBtn}>Browse Quizzes</Link>
                    <Link to="/student/notes" style={styles.primaryBtn}>📚 My Notes</Link>
                    <Link to="/student/coding" style={styles.primaryBtn}>💻 Coding</Link>
                    <Link to="/student/analytics" style={styles.outlineBtn}>My Analytics</Link>
                </div>

                <h2 style={styles.sectionTitle}>Recent Attempts</h2>
                <div style={styles.attemptList}>
                    {!attemptsLoaded ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} style={{ ...styles.attemptItem, gap: '1rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Skeleton w="50%" h={16} r={4} />
                                    <Skeleton w="30%" h={12} r={4} />
                                </div>
                                <Skeleton w={60} h={32} r={20} />
                            </div>
                        ))
                    ) : attempts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No attempts yet. Start a quiz!</p>
                    ) : (
                        attempts.slice(0, 5).map((a) => (
                            <motion.div key={a._id} whileHover={{ x: 4 }} style={styles.attemptItem}>
                                <div>
                                    <div style={styles.quizName}>{a.quizId?.title || 'Quiz'}</div>
                                    <div style={styles.quizMeta}>{a.quizId?.category} · {new Date(a.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div style={styles.right}>
                                    <span style={{ ...styles.scoreBadge, background: a.score >= 70 ? '#10b98120' : a.score >= 40 ? '#f59e0b20' : '#ef444420', color: a.score >= 70 ? '#10b981' : a.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                        {a.score}%
                                    </span>
                                    <Link to={`/student/result/${a._id}`} style={styles.link}>View →</Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Coding Attempts */}
                <h2 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>💻 Recent Coding Submissions</h2>
                <div style={styles.attemptList}>
                    {!codingLoaded ? (
                        [1, 2].map((i) => (
                            <div key={i} style={{ ...styles.attemptItem, gap: '1rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Skeleton w="50%" h={16} r={4} />
                                    <Skeleton w="30%" h={12} r={4} />
                                </div>
                                <Skeleton w={80} h={32} r={20} />
                            </div>
                        ))
                    ) : codingAttempts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No coding submissions yet. <Link to="/student/coding" style={{ color: 'var(--primary)', fontWeight: 600 }}>Try a challenge →</Link></p>
                    ) : (
                        codingAttempts.slice(0, 5).map((a) => (
                            <motion.div key={a._id} whileHover={{ x: 4 }} style={styles.attemptItem}>
                                <div>
                                    <div style={styles.quizName}>{a.challengeId?.title || 'Challenge'}</div>
                                    <div style={styles.quizMeta}>
                                        {a.language} · {a.challengeId?.difficulty} · {new Date(a.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={styles.right}>
                                    <span style={{
                                        ...styles.scoreBadge,
                                        background: a.status === 'passed' ? '#10b98120' : a.status === 'partial' ? '#f59e0b20' : '#ef444420',
                                        color: a.status === 'passed' ? '#10b981' : a.status === 'partial' ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {a.status === 'passed' ? '✅ Accepted' : a.status === 'partial' ? `⚠️ ${a.testsPassed}/${a.totalTests}` : '❌ Failed'}
                                    </span>
                                    <Link to={`/student/coding/${a.challengeId?._id}`} style={styles.link}>Retry →</Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const styles = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' },
    sub: { color: 'var(--text-muted)', marginBottom: '2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    skeletonCard: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid var(--border)' },
    actions: { display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' },
    primaryBtn: { background: 'var(--primary)', color: '#fff', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600 },
    outlineBtn: { border: '2px solid var(--primary)', color: 'var(--primary)', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600 },
    sectionTitle: { fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' },
    attemptList: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    attemptItem: { background: 'var(--card)', borderRadius: '12px', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border)' },
    quizName: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' },
    quizMeta: { fontSize: '0.85rem', color: 'var(--text-muted)' },
    right: { display: 'flex', alignItems: 'center', gap: '1rem' },
    scoreBadge: { padding: '0.3rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' },
    link: { color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' },
};

export default StudentDashboard;

