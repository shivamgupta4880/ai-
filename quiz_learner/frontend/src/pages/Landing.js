import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
    { icon: '🤖', title: 'AI Question Generator', desc: 'Auto-generate quiz questions on any topic using AI.' },
    { icon: '📊', title: 'Smart Analytics', desc: 'Track performance, identify weak topics, and improve.' },
    { icon: '🎯', title: 'Personalized Feedback', desc: 'Get AI-powered suggestions tailored to your results.' },
    { icon: '👨‍🏫', title: 'Teacher Tools', desc: 'Create, manage, and analyze quizzes with ease.' },
];

const Landing = () => (
    <div>
        {/* Hero */}
        <section style={styles.hero}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={styles.heroContent}>
                <div style={styles.heroBadge}>🚀 AI-Powered Learning</div>
                <h1 style={styles.heroTitle}>Learn Smarter with <span style={{ color: 'var(--primary)' }}>Quiz Learner</span></h1>
                <p style={styles.heroSub}>An intelligent quiz platform that adapts to your learning style, identifies weak areas, and helps you grow faster.</p>
                <div style={styles.heroBtns}>
                    <Link to="/signup" style={styles.primaryBtn}>Get Started Free</Link>
                    <Link to="/login" style={styles.outlineBtn}>Login</Link>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} style={styles.heroIllustration}>
                🧠
            </motion.div>
        </section>

        {/* Features */}
        <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Why Quiz Learner?</h2>
            <div style={styles.grid}>
                {features.map((f, i) => (
                    <motion.div key={i} whileHover={{ y: -6 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={styles.featureCard}>
                        <div style={styles.featureIcon}>{f.icon}</div>
                        <h3 style={styles.featureTitle}>{f.title}</h3>
                        <p style={styles.featureDesc}>{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* CTA */}
        <section style={styles.cta}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to boost your learning?</h2>
            <Link to="/signup" style={styles.primaryBtn}>Start Learning Now →</Link>
        </section>
    </div>
);

const styles = {
    hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 4rem)', minHeight: '80vh', background: 'linear-gradient(135deg, #6366f110, #06b6d410)' },
    heroContent: { flex: '1 1 280px', maxWidth: 600 },
    heroBadge: { display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' },
    heroTitle: { fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.2rem', color: 'var(--text)' },
    heroSub: { fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' },
    heroBtns: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    primaryBtn: { background: 'var(--primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', display: 'inline-block' },
    outlineBtn: { border: '2px solid var(--primary)', color: 'var(--primary)', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', display: 'inline-block' },
    heroIllustration: { fontSize: 'clamp(4rem, 12vw, 10rem)', flex: '0 0 auto' },
    section: { padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 4rem)', background: 'var(--bg)' },
    sectionTitle: { fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', color: 'var(--text)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' },
    featureCard: { background: 'var(--card)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', textAlign: 'center' },
    featureIcon: { fontSize: '2.5rem', marginBottom: '1rem' },
    featureTitle: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' },
    featureDesc: { color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.9rem' },
    cta: { padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 4rem)', textAlign: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff' },
};

export default Landing;
