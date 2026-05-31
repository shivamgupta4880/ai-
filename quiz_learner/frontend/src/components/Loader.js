import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ text = 'Loading...' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
);

export default Loader;
