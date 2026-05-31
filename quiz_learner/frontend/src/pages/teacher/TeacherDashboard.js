import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTeacherQuizzes, getAllQuizzes, getTimetable } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

const Skeleton = ({ w = '100%', h = 20, r = 8 }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,var(--border) 25%,var(--card) 50%,var(--border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />
);

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchFn = user?.role === 'admin' ? getAllQuizzes : getTeacherQuizzes;
        fetchFn()
            .then(({ data }) => setQuizzes(data))
            .catch(() => { })
            .finally(() => setLoaded(true));
        getTimetable()
            .then(({ data }) => setTimetable(data))
            .catch(() => { });
    }, [user]);

    const published = quizzes.filter((q) => q.isPublished).length;
    const totalAttempts = quizzes.reduce((a, q) => a + (q.totalAttempts || 0), 0);

    return (
        <div style={styles.page}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                <h1 style={styles.title}>Welcome, {user?.name} 👋</h1>
                <p style={styles.sub}>Manage your quizzes and track student performance</p>

                {/* Stats */}
                <div style={styles.grid}>
                    {loaded ? (
                        <>
                            <StatCard icon="📝" label="Total Quizzes" value={quizzes.length} color="#6366f1" />
                            <StatCard icon="✅" label="Published" value={published} color="#10b981" />
                            <StatCard icon="🏆" label="Total Attempts" value={totalAttempts} color="#f59e0b" />
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
                </div>

                <div style={styles.actions}>
                    <Link to="/teacher/create-quiz" style={styles.primaryBtn}>+ Create New Quiz</Link>
                    <Link to="/teacher/quizzes" style={styles.outlineBtn}>Manage Quizzes</Link>
                    <Link to="/teacher/notes" style={styles.outlineBtn}>📝 Manage Notes</Link>
                    <Link to="/teacher/section-results" style={styles.outlineBtn}>📊 Section Results</Link>
                </div>

                {/* My Timetable */}
                {timetable.length > 0 && (
                    <>
                        <h2 style={styles.sectionTitle}>🗓️ My Timetable</h2>
                        <div style={styles.quizList}>
                            {timetable.map(t => (
                                <motion.div key={t._id} whileHover={{ x: 4 }} style={styles.quizItem}>
                                    <div>
                                        <div style={styles.quizTitle}>{t.subject}</div>
                                        <div style={styles.quizMeta}>{t.targetClass} · Section {t.section} · {t.day}</div>
                                    </div>
                                    <div style={styles.quizRight}>
                                        <span style={{ ...styles.badge, background: '#6366f120', color: 'var(--primary)' }}>{t.startTime} – {t.endTime}</span>
                                        {t.room && <span style={{ ...styles.badge, background: '#f59e0b20', color: '#f59e0b' }}>🚪 {t.room}</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}

                <h2 style={styles.sectionTitle}>Recent Quizzes</h2>
                <div style={styles.quizList}>
                    {!loaded ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} style={{ ...styles.quizItem, gap: '1rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Skeleton w="45%" h={16} r={4} />
                                    <Skeleton w="30%" h={12} r={4} />
                                </div>
                                <Skeleton w={80} h={28} r={20} />
                            </div>
                        ))
                    ) : quizzes.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No quizzes yet. Create your first quiz!</p>
                    ) : (
                        quizzes.slice(0, 5).map((q) => (
                            <motion.div key={q._id} whileHover={{ x: 4 }} style={styles.quizItem}>
                                <div>
                                    <div style={styles.quizTitle}>{q.title}</div>
                                    <div style={styles.quizMeta}>
                                        {q.category} · {q.difficulty} · {q.questionCount ?? q.questions?.length ?? 0} questions
                                    </div>
                                </div>
                                <div style={styles.quizRight}>
                                    <span style={{ ...styles.badge, background: q.isPublished ? '#10b98120' : '#f59e0b20', color: q.isPublished ? '#10b981' : '#f59e0b' }}>
                                        {q.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                    <span style={styles.attempts}>{q.totalAttempts} attempts</span>
                                    <Link to={`/teacher/quiz-analytics/${q._id}`} style={styles.link}>Analytics →</Link>
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
    quizList: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    quizItem: { background: 'var(--card)', borderRadius: '12px', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border)' },
    quizTitle: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' },
    quizMeta: { fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' },
    quizRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    badge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 },
    attempts: { fontSize: '0.85rem', color: 'var(--text-muted)' },
    link: { color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' },
};

export default TeacherDashboard;

