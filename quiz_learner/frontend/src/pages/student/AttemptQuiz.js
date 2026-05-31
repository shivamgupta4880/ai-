import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getQuizById, submitAttempt, markAttendance, getMyAttendance } from '../../utils/api';
import Loader from '../../components/Loader';

const MAX_TAB_SWITCHES = 3;

const AttemptQuiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [current, setCurrent] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [scheduledAt, setScheduledAt] = useState(null);
    const [countdown, setCountdown] = useState(null);

    // Tab switch
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [warningMsg, setWarningMsg] = useState('');
    const tabSwitchRef = useRef(0);
    const submittingRef = useRef(false);

    // Attendance
    const [showAttendance, setShowAttendance] = useState(false);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const [markingAttendance, setMarkingAttendance] = useState(false);

    useEffect(() => {
        getQuizById(id)
            .then(({ data }) => {
                setQuiz(data);
                setAnswers(new Array(data.questions.length).fill(-1));
                setTimeLeft(data.duration * 60);
                if (data.attendanceEnabled) {
                    getMyAttendance(id).then(({ data: att }) => {
                        if (att) setAttendanceMarked(true);
                        else setShowAttendance(true);
                    }).catch(() => setShowAttendance(true));
                }
            })
            .catch((err) => {
                if (err.response?.status === 403 && err.response?.data?.scheduledAt) {
                    setScheduledAt(new Date(err.response.data.scheduledAt));
                } else {
                    toast.error(err.response?.data?.message || 'Failed to load quiz');
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    // Countdown for scheduled quiz
    useEffect(() => {
        if (!scheduledAt) return;
        const tick = setInterval(() => {
            const diff = scheduledAt - new Date();
            if (diff <= 0) { clearInterval(tick); window.location.reload(); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
        }, 1000);
        return () => clearInterval(tick);
    }, [scheduledAt]);

    const handleSubmit = useCallback(async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const { data } = await submitAttempt({ quizId: id, answers, timeTaken });
            toast.success('Quiz submitted!');
            navigate(`/student/result/${data._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
            setSubmitting(false);
            submittingRef.current = false;
        }
    }, [id, answers, startTime, navigate]);

    // Tab switch detection
    useEffect(() => {
        if (!quiz) return;

        const handleVisibilityChange = () => {
            if (document.hidden && !submittingRef.current) {
                tabSwitchRef.current += 1;
                const count = tabSwitchRef.current;
                setTabSwitchCount(count);
                const remaining = MAX_TAB_SWITCHES - count;

                if (count >= MAX_TAB_SWITCHES) {
                    setWarningMsg('🚨 Maximum tab switches exceeded! Submitting your test automatically...');
                    setShowTabWarning(true);
                    setTimeout(() => {
                        setShowTabWarning(false);
                        handleSubmit();
                    }, 2500);
                } else {
                    setWarningMsg(`⚠️ Tab switch detected! Warning ${count}/${MAX_TAB_SWITCHES}. ${remaining} warning${remaining > 1 ? 's' : ''} left before auto-submit.`);
                    setShowTabWarning(true);
                    setTimeout(() => setShowTabWarning(false), 4000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [quiz, handleSubmit]);

    // Timer
    useEffect(() => {
        if (!timeLeft || !quiz) return;
        const timer = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [quiz, handleSubmit, timeLeft]);

    const handleMarkAttendance = async () => {
        setMarkingAttendance(true);
        try {
            await markAttendance({ quizId: id });
            setAttendanceMarked(true);
            setShowAttendance(false);
            toast.success('Attendance marked!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setMarkingAttendance(false); }
    };

    if (loading) return <Loader />;

    if (scheduledAt) {
        return (
            <div style={styles.page}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.schedCard}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
                    <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Quiz Not Started Yet</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Scheduled for: {scheduledAt.toLocaleString()}
                    </p>
                    {countdown && (
                        <div style={styles.countdownBox}>
                            Starts in: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{countdown}</span>
                        </div>
                    )}
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Go Back</button>
                </motion.div>
            </div>
        );
    }

    if (!quiz) return <p style={{ padding: '2rem' }}>Quiz not found</p>;

    const q = quiz.questions[current];
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    const progress = ((current + 1) / quiz.questions.length) * 100;

    return (
        <div style={styles.page}>
            {/* Tab Switch Warning Banner */}
            <AnimatePresence>
                {showTabWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -80 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -80 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                            background: tabSwitchCount >= MAX_TAB_SWITCHES ? '#ef4444' : '#f59e0b',
                            color: '#fff', padding: '1rem 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '1rem', fontWeight: 700, fontSize: '1rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}>
                        <span style={{ fontSize: '1.5rem' }}>{tabSwitchCount >= MAX_TAB_SWITCHES ? '🚨' : '⚠️'}</span>
                        <span>{warningMsg}</span>
                        <span style={{ background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                            {tabSwitchCount}/{MAX_TAB_SWITCHES}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attendance Modal */}
            <AnimatePresence>
                {showAttendance && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={styles.modal}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                            <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Mark Your Attendance</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Please mark your attendance before starting the quiz.
                            </p>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleMarkAttendance}
                                disabled={markingAttendance} style={styles.attendBtn}>
                                {markingAttendance ? 'Marking...' : '✅ Mark Present'}
                            </motion.button>
                            <button onClick={() => setShowAttendance(false)} style={styles.skipBtn}>Skip for now</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.quizTitle}>{quiz.title}</h2>
                    <p style={styles.meta}>
                        {quiz.category} · {quiz.questions.length} questions
                        {attendanceMarked && <span style={styles.attBadge}>✅ Present</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {tabSwitchCount > 0 && (
                        <div style={{
                            background: tabSwitchCount >= MAX_TAB_SWITCHES - 1 ? '#ef444420' : '#f59e0b20',
                            color: tabSwitchCount >= MAX_TAB_SWITCHES - 1 ? '#ef4444' : '#f59e0b',
                            padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
                            border: `1px solid ${tabSwitchCount >= MAX_TAB_SWITCHES - 1 ? '#ef4444' : '#f59e0b'}`
                        }}>
                            ⚠️ {tabSwitchCount}/{MAX_TAB_SWITCHES} switches
                        </div>
                    )}
                    <div style={{ ...styles.timer, color: timeLeft < 60 ? '#ef4444' : 'var(--primary)' }}>
                        ⏱ {mins}:{secs}
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div style={styles.progressBar}>
                <motion.div animate={{ width: `${progress}%` }} style={styles.progressFill} />
            </div>
            <p style={styles.progressText}>Question {current + 1} of {quiz.questions.length}</p>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={styles.questionCard}>
                    <div style={styles.diffBadge}>{q.difficulty}</div>
                    <h3 style={styles.questionText}>{q.questionText}</h3>
                    <div style={styles.options}>
                        {q.options.map((opt, oi) => (
                            <motion.button key={oi} whileTap={{ scale: 0.98 }}
                                onClick={() => { const u = [...answers]; u[current] = oi; setAnswers(u); }}
                                style={{ ...styles.option, background: answers[current] === oi ? 'var(--primary)' : 'var(--bg)', color: answers[current] === oi ? '#fff' : 'var(--text)', borderColor: answers[current] === oi ? 'var(--primary)' : 'var(--border)' }}>
                                <span style={styles.optLabel}>{String.fromCharCode(65 + oi)}</span>
                                {opt}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div style={styles.nav}>
                <button onClick={() => setCurrent((c) => c - 1)} disabled={current === 0} style={styles.navBtn}>← Previous</button>
                <div style={styles.dots}>
                    {quiz.questions.map((_, i) => (
                        <button key={i} onClick={() => setCurrent(i)} style={{ ...styles.dot, background: answers[i] !== -1 ? 'var(--primary)' : i === current ? 'var(--secondary)' : 'var(--border)' }} />
                    ))}
                </div>
                {current < quiz.questions.length - 1 ? (
                    <button onClick={() => setCurrent((c) => c + 1)} style={styles.nextBtn}>Next →</button>
                ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting} style={styles.submitBtn}>
                        {submitting ? 'Submitting...' : '✅ Submit Quiz'}
                    </motion.button>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { padding: '1rem', maxWidth: 800, margin: '0 auto' },
    schedCard: { background: 'var(--card)', borderRadius: '24px', padding: '3rem', textAlign: 'center', border: '1px solid var(--border)', maxWidth: 480, margin: '4rem auto' },
    countdownBox: { background: 'var(--bg)', borderRadius: '12px', padding: '1rem 2rem', fontSize: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--border)' },
    backBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'var(--card)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', maxWidth: 380, width: '90%', border: '1px solid var(--border)' },
    attendBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem 2rem', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', width: '100%', marginBottom: '0.8rem' },
    skipBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' },
    attBadge: { background: '#10b98120', color: '#10b981', padding: '0.1rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.5rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    quizTitle: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' },
    meta: { color: 'var(--text-muted)', fontSize: '0.9rem' },
    timer: { fontSize: '1.5rem', fontWeight: 700, background: 'var(--card)', padding: '0.5rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border)' },
    progressBar: { height: 8, background: 'var(--border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '0.5rem' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '20px' },
    progressText: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' },
    questionCard: { background: 'var(--card)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '2rem' },
    diffBadge: { display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'capitalize' },
    questionText: { fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.5rem', lineHeight: 1.5 },
    options: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    option: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', borderRadius: '12px', border: '2px solid', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.15s' },
    optLabel: { fontWeight: 700, minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
    navBtn: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    nextBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    submitBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    dots: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' },
    dot: { width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer' },
};

export default AttemptQuiz;

