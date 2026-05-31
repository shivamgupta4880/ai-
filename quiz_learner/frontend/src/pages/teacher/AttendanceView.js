import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getTeacherQuizzes, getQuizAttendance, teacherMarkAttendance } from '../../utils/api';
import Loader from '../../components/Loader';

const AttendanceView = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attLoading, setAttLoading] = useState(false);

    useEffect(() => {
        getTeacherQuizzes()
            .then(({ data }) => setQuizzes(data.filter(q => q.attendanceEnabled)))
            .finally(() => setLoading(false));
    }, []);

    const fetchAttendance = async (quizId) => {
        setAttLoading(true);
        try {
            const { data } = await getQuizAttendance(quizId);
            setAttendance(data);
        } catch { toast.error('Failed to load attendance'); }
        finally { setAttLoading(false); }
    };

    const handleQuizChange = (qid) => {
        setSelectedQuiz(qid);
        if (qid) fetchAttendance(qid);
        else setAttendance([]);
    };

    const handleToggle = async (studentId, currentStatus) => {
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        try {
            await teacherMarkAttendance({ quizId: selectedQuiz, studentId, status: newStatus });
            setAttendance(prev => prev.map(a =>
                a.studentId?._id === studentId ? { ...a, status: newStatus, markedBy: 'teacher' } : a
            ));
            toast.success(`Marked ${newStatus}`);
        } catch { toast.error('Failed to update'); }
    };

    if (loading) return <Loader />;

    const present = attendance.filter(a => a.status === 'present').length;

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>📋 Attendance</h1>

            <div style={styles.card}>
                <label style={styles.label}>Select Quiz</label>
                <select style={styles.select} value={selectedQuiz} onChange={e => handleQuizChange(e.target.value)}>
                    <option value="">-- Select a quiz --</option>
                    {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
                </select>
                {quizzes.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>
                        No quizzes with attendance enabled. Enable attendance when creating a quiz.
                    </p>
                )}
            </div>

            {selectedQuiz && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
                    <div style={styles.statsRow}>
                        <span style={styles.statBadge}>Total: {attendance.length}</span>
                        <span style={{ ...styles.statBadge, background: '#10b98120', color: '#10b981' }}>Present: {present}</span>
                        <span style={{ ...styles.statBadge, background: '#ef444420', color: '#ef4444' }}>Absent: {attendance.length - present}</span>
                    </div>

                    {attLoading ? <Loader /> : attendance.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No attendance records yet.</p>
                    ) : (
                        <div style={styles.list}>
                            {attendance.map((a) => (
                                <motion.div key={a._id} whileHover={{ x: 3 }} style={styles.row}>
                                    <div>
                                        <div style={styles.name}>{a.studentId?.name || 'Student'}</div>
                                        <div style={styles.email}>{a.studentId?.email} · {a.studentId?.studentClass || ''}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Marked by: {a.markedBy} · {new Date(a.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(a.studentId?._id, a.status)}
                                        style={{ ...styles.toggleBtn, background: a.status === 'present' ? '#10b98120' : '#ef444420', color: a.status === 'present' ? '#10b981' : '#ef4444' }}>
                                        {a.status === 'present' ? '✅ Present' : '❌ Absent'}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 900, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '1.8rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    label: { display: 'block', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
    select: { width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' },
    statsRow: { display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
    statBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.3rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: '12px', padding: '1rem 1.2rem', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.8rem' },
    name: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' },
    email: { fontSize: '0.85rem', color: 'var(--text-muted)' },
    toggleBtn: { border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
};

export default AttendanceView;
