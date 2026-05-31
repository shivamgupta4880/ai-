import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Signup = () => (
    <div style={styles.wrapper}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={styles.title}>Registration Restricted</h2>
            <p style={styles.sub}>
                Account creation is managed by the Admin only.<br />
                Please contact your administrator to get access.
            </p>
            <Link to="/login" style={styles.btn}>← Back to Login</Link>
        </motion.div>
    </div>
);

const styles = {
    wrapper: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f115,#06b6d415)', padding: '2rem' },
    card: { background: 'var(--card)', borderRadius: '24px', padding: '3rem 2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(99,102,241,0.15)', border: '1px solid var(--border)', textAlign: 'center' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    sub: { color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7 },
    btn: { background: 'var(--primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 600, display: 'inline-block' },
};

export default Signup;
