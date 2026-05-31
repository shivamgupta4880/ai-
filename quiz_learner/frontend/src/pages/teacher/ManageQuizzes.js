import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getTeacherQuizzes, getAllQuizzes, deleteQuiz, updateQuiz } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const ManageQuizzes = () => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFn = user?.role === 'admin' ? getAllQuizzes : getTeacherQuizzes;
        fetchFn().then(({ data }) => setQuizzes(data)).finally(() => setLoading(false));
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this quiz?')) return;
        try {
            await deleteQuiz(id);
            setQuizzes((prev) => prev.filter((q) => q._id !== id));
            toast.success('Quiz deleted');
        } catch { toast.error('Delete failed'); }
    };

    const togglePublish = async (quiz) => {
        try {
            const { data } = await updateQuiz(quiz._id, { isPublished: !quiz.isPublished });
            setQuizzes((prev) => prev.map((q) => (q._id === data._id ? data : q)));
            toast.success(data.isPublished ? 'Quiz published!' : 'Quiz unpublished');
        } catch { toast.error('Update failed'); }
    };

    if (loading) return <Loader />;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>My Quizzes</h1>
                <Link to="/teacher/create-quiz" style={styles.createBtn}>+ Create Quiz</Link>
            </div>
            <div style={styles.grid}>
                {quizzes.map((q) => (
                    <motion.div key={q._id} whileHover={{ y: -4 }} style={styles.card}>
                        <div style={styles.cardTop}>
                            <span style={{ ...styles.diffBadge, background: q.difficulty === 'easy' ? '#10b98120' : q.difficulty === 'medium' ? '#f59e0b20' : '#ef444420', color: q.difficulty === 'easy' ? '#10b981' : q.difficulty === 'medium' ? '#f59e0b' : '#ef4444' }}>{q.difficulty}</span>
                            <span style={{ ...styles.pubBadge, background: q.isPublished ? '#10b98120' : '#94a3b820', color: q.isPublished ? '#10b981' : '#94a3b8' }}>{q.isPublished ? '✅ Published' : '📝 Draft'}</span>
                        </div>
                        <h3 style={styles.quizTitle}>{q.title}</h3>
                        <p style={styles.quizMeta}>{q.category} · {(q.questions || []).length} questions · {q.duration} min</p>
                        <p style={styles.attempts}>🏆 {q.totalAttempts} attempts</p>
                        <div style={styles.cardBtns}>
                            <button onClick={() => togglePublish(q)} style={styles.btn}>{q.isPublished ? 'Unpublish' : 'Publish'}</button>
                            <Link to={`/teacher/quiz-analytics/${q._id}`} style={styles.btn}>Analytics</Link>
                            <button onClick={() => handleDelete(q._id)} style={{ ...styles.btn, background: '#ef444420', color: '#ef4444' }}>Delete</button>
                        </div>
                    </motion.div>
                ))}
                {quizzes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No quizzes yet.</p>}
            </div>
        </div>
    );
};

const styles = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    createBtn: { background: 'var(--primary)', color: '#fff', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    cardTop: { display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' },
    diffBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' },
    pubBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    quizTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' },
    quizMeta: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'capitalize' },
    attempts: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' },
    cardBtns: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    btn: { background: '#6366f120', color: 'var(--primary)', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
};

export default ManageQuizzes;


