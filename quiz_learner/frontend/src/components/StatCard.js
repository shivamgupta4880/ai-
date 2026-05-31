import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon, label, value, color = 'var(--primary)' }) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(99,102,241,0.15)' }}
        style={{ ...styles.card, borderTop: `4px solid ${color}` }}
    >
        <div style={{ ...styles.icon, background: color + '20', color }}>{icon}</div>
        <div>
            <div style={styles.value}>{value}</div>
            <div style={styles.label}>{label}</div>
        </div>
    </motion.div>
);

const styles = {
    card: {
        background: 'var(--card)', borderRadius: '16px', padding: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1.2rem',
        boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
    },
    icon: { fontSize: '1.8rem', padding: '0.8rem', borderRadius: '12px' },
    value: { fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' },
    label: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' },
};

export default StatCard;
