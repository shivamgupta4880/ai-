import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginUser, sendOtp, loginWithOtp, resetPassword } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// mode: 'password' | 'otp-login' | 'forgot'
const Login = () => {
    const [mode, setMode] = useState('password');
    const [form, setForm] = useState({ email: '', password: '', otp: '', newPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const redirectUser = (data) => {
        login(data);
        toast.success(`Welcome, ${data.name}!`);
        const path = data.role === 'admin' ? '/admin' : data.role === 'teacher' ? '/teacher' : '/student';
        navigate(path);
    };

    // --- Password Login ---
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await loginUser({ email: form.email, password: form.password });
            redirectUser(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    // --- Send OTP ---
    const handleSendOtp = async (purpose) => {
        if (!form.email) return toast.error('Enter your email first');
        setLoading(true);
        try {
            await sendOtp({ email: form.email, purpose });
            setOtpSent(true);
            toast.success('OTP sent to your email');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    // --- OTP Login ---
    const handleOtpLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await loginWithOtp({ email: form.email, otp: form.otp });
            redirectUser(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    // --- Reset Password ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword({ email: form.email, otp: form.otp, newPassword: form.newPassword });
            toast.success('Password reset successful! Please login.');
            setMode('password');
            setOtpSent(false);
            setForm({ email: '', password: '', otp: '', newPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally { setLoading(false); }
    };

    return (
        <div style={styles.wrapper}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
                <div style={styles.logo}>🧠</div>

                {/* Mode Tabs */}
                <div style={styles.tabs}>
                    <button style={{ ...styles.tab, ...(mode === 'password' ? styles.tabActive : {}) }} onClick={() => { setMode('password'); setOtpSent(false); }}>Password</button>
                    <button style={{ ...styles.tab, ...(mode === 'otp-login' ? styles.tabActive : {}) }} onClick={() => { setMode('otp-login'); setOtpSent(false); }}>OTP Login</button>
                    <button style={{ ...styles.tab, ...(mode === 'forgot' ? styles.tabActive : {}) }} onClick={() => { setMode('forgot'); setOtpSent(false); }}>Forgot Password</button>
                </div>

                <AnimatePresence mode="wait">
                    {/* PASSWORD LOGIN */}
                    {mode === 'password' && (
                        <motion.form key="pw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handlePasswordLogin} style={styles.form}>
                            <input style={styles.input} type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
                            <div style={styles.pwWrap}>
                                <input style={{ ...styles.input, paddingRight: '3rem' }} type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} required />
                                <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>{showPassword ? '🙈' : '👁️'}</button>
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.btn} disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* OTP LOGIN */}
                    {mode === 'otp-login' && (
                        <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleOtpLogin} style={styles.form}>
                            <input style={styles.input} type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
                            {!otpSent ? (
                                <motion.button whileTap={{ scale: 0.97 }} type="button" style={styles.btn} disabled={loading} onClick={() => handleSendOtp('login')}>
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </motion.button>
                            ) : (
                                <>
                                    <input style={styles.input} type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={e => set('otp', e.target.value)} maxLength={6} required />
                                    <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.btn} disabled={loading}>
                                        {loading ? 'Verifying...' : 'Login with OTP'}
                                    </motion.button>
                                    <button type="button" style={styles.resendBtn} onClick={() => handleSendOtp('login')} disabled={loading}>Resend OTP</button>
                                </>
                            )}
                        </motion.form>
                    )}

                    {/* FORGOT PASSWORD */}
                    {mode === 'forgot' && (
                        <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} style={styles.form}>
                            <input style={styles.input} type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
                            {!otpSent ? (
                                <motion.button whileTap={{ scale: 0.97 }} type="button" style={styles.btn} disabled={loading} onClick={() => handleSendOtp('reset')}>
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </motion.button>
                            ) : (
                                <>
                                    <input style={styles.input} type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={e => set('otp', e.target.value)} maxLength={6} required />
                                    <div style={styles.pwWrap}>
                                        <input style={{ ...styles.input, paddingRight: '3rem' }} type={showNewPassword ? 'text' : 'password'} placeholder="New Password (min 6 chars)" value={form.newPassword} onChange={e => set('newPassword', e.target.value)} required />
                                        <button type="button" style={styles.eyeBtn} onClick={() => setShowNewPassword(v => !v)}>{showNewPassword ? '🙈' : '👁️'}</button>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.btn} disabled={loading}>
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </motion.button>
                                    <button type="button" style={styles.resendBtn} onClick={() => handleSendOtp('reset')} disabled={loading}>Resend OTP</button>
                                </>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>

                <p style={styles.footer}>Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link></p>
            </motion.div>
        </div>
    );
};

const styles = {
    wrapper: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f115, #06b6d415)', padding: '2rem' },
    card: { background: 'var(--card)', borderRadius: '24px', padding: '2.5rem 2.5rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(99,102,241,0.15)', border: '1px solid var(--border)', textAlign: 'center' },
    logo: { fontSize: '3rem', marginBottom: '0.8rem' },
    tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'var(--bg)', borderRadius: '12px', padding: '4px' },
    tab: { flex: 1, padding: '0.5rem 0.3rem', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer' },
    tabActive: { background: 'var(--primary)', color: '#fff', fontWeight: 600 },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    input: { padding: '0.9rem 1.2rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
    btn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' },
    resendBtn: { background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-muted)', padding: '0.6rem', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer' },
    pwWrap: { position: 'relative' },
    eyeBtn: { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 },
    footer: { marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
};

export default Login;
