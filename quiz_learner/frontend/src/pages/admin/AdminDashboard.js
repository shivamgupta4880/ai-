import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getPlatformAnalytics, createUserByAdmin } from '../../utils/api';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import FaceVerification from '../../components/FaceVerification';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentClass: '', section: '' });
    const [creating, setCreating] = useState(false);
    const [faceVerified, setFaceVerified] = useState(() => sessionStorage.getItem('adminFaceVerified') === 'true');
    const [showFaceVerify, setShowFaceVerify] = useState(!sessionStorage.getItem('adminFaceVerified'));

    const handleFaceVerified = () => {
        sessionStorage.setItem('adminFaceVerified', 'true');
        setFaceVerified(true);
        setShowFaceVerify(false);
        toast.success('Face verified! Welcome, Admin.');
    };

    const handleFaceCancel = () => {
        navigate('/login');
    };

    useEffect(() => {
        getPlatformAnalytics()
            .then(({ data }) => setStats(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createUserByAdmin(form);
            toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created for ${form.name}!`);
            setForm({ name: '', email: '', password: '', role: 'student', studentClass: '', section: '' });
            setShowForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally { setCreating(false); }
    };

    if (loading) return <Loader />;

    return (
        <div style={styles.page}>
            {/* Face Verification Modal */}
            {showFaceVerify && (
                <FaceVerification
                    onVerified={handleFaceVerified}
                    onCancel={handleFaceCancel}
                />
            )}

            {/* Blur content until verified */}
            <div style={{ filter: faceVerified ? 'none' : 'blur(8px)', pointerEvents: faceVerified ? 'auto' : 'none', transition: 'filter 0.3s' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <p style={styles.sub}>Platform overview and user management</p>

                    {/* Stats */}
                    <div style={styles.grid}>
                        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers || 0} color="#6366f1" />
                        <StatCard icon="🎓" label="Students" value={stats?.totalStudents || 0} color="#10b981" />
                        <StatCard icon="👨‍🏫" label="Teachers" value={stats?.totalTeachers || 0} color="#f59e0b" />
                        <StatCard icon="📝" label="Total Quizzes" value={stats?.totalQuizzes || 0} color="#06b6d4" />
                        <StatCard icon="🏆" label="Total Attempts" value={stats?.totalAttempts || 0} color="#ef4444" />
                    </div>

                    {/* Create User */}
                    <div style={styles.createSection}>
                        <div style={styles.createHeader}>
                            <h2 style={styles.sectionTitle}>👤 Create New Account</h2>
                            <button onClick={() => setShowForm(!showForm)} style={styles.toggleBtn}>
                                {showForm ? '✕ Cancel' : '+ Create User'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showForm && (
                                <motion.form
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleCreate}
                                    style={styles.form}
                                >
                                    <div style={styles.formGrid}>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Full Name *</label>
                                            <input style={styles.input} placeholder="Enter full name" value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                        </div>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Email Address *</label>
                                            <input style={styles.input} type="email" placeholder="Enter email" value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                        </div>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Password *</label>
                                            <input style={styles.input} type="password" placeholder="Min 6 characters" value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                                        </div>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Role *</label>
                                            <select style={styles.input} value={form.role}
                                                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                                <option value="student">Student</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        {form.role === 'student' && (
                                            <>
                                                <div style={styles.field}>
                                                    <label style={styles.label}>Class</label>
                                                    <select style={styles.input} value={form.studentClass}
                                                        onChange={(e) => setForm({ ...form, studentClass: e.target.value, collegeCourse: '' })}>
                                                        <option value="">Select Class</option>
                                                        {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
                                                            'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year']
                                                            .map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                {form.studentClass?.startsWith('College') && (
                                                    <div style={styles.field}>
                                                        <label style={styles.label}>Course</label>
                                                        <select style={styles.input} value={form.collegeCourse}
                                                            onChange={(e) => setForm({ ...form, collegeCourse: e.target.value })}>
                                                            <option value="">Select Course</option>
                                                            {['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other']
                                                                .map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                                <div style={styles.field}>
                                                    <label style={styles.label}>Section</label>
                                                    <input style={styles.input} placeholder="e.g. A, B, K22DFO" value={form.section}
                                                        onChange={(e) => setForm({ ...form, section: e.target.value })} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.submitBtn} disabled={creating}>
                                        {creating ? 'Creating...' : `✅ Create ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Account`}
                                    </motion.button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Quick Actions */}
                    <h2 style={styles.sectionTitle}>Quick Actions</h2>
                    <div style={styles.actions}>
                        <Link to="/admin/users" style={styles.actionCard}>
                            <span style={styles.actionIcon}>👥</span>
                            <span>Manage Users</span>
                        </Link>
                        <Link to="/admin/quizzes" style={styles.actionCard}>
                            <span style={styles.actionIcon}>📝</span>
                            <span>Monitor Quizzes</span>
                        </Link>
                        <Link to="/admin/analytics" style={styles.actionCard}>
                            <span style={styles.actionIcon}>📊</span>
                            <span>Platform Analytics</span>
                        </Link>
                        <Link to="/admin/timetable" style={styles.actionCard}>
                            <span style={styles.actionIcon}>🗓️</span>
                            <span>Timetable</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const styles = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' },
    sub: { color: 'var(--text-muted)', marginBottom: '2.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    createSection: { background: 'var(--card)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '2.5rem' },
    createHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    toggleBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    form: { borderTop: '1px solid var(--border)', paddingTop: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem' },
    submitBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem 2.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' },
    actions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' },
    actionCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', fontWeight: 600, color: 'var(--text)', boxShadow: 'var(--shadow)' },
    actionIcon: { fontSize: '2.5rem' },
};

export default AdminDashboard;

