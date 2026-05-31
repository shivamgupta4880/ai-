import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMyAttendanceFull } from '../../utils/api';
import Loader from '../../components/Loader';

const MyAttendance = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        getMyAttendanceFull()
            .then(({ data }) => setRecords(data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const pct = records.length ? Math.round((present / records.length) * 100) : 0;

    if (loading) return <Loader />;

    return (
        <div style={s.page}>
            <h1 style={s.title}>📋 My Attendance</h1>

            {/* Stats */}
            <div style={s.statsRow}>
                <div style={{ ...s.statCard, borderColor: 'var(--primary)' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 800 }}>{pct}%</span>
                    <span style={s.statLabel}>Overall Attendance</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#10b981' }}>
                    <span style={{ color: '#10b981', fontSize: '1.8rem', fontWeight: 800 }}>{present}</span>
                    <span style={s.statLabel}>Present</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#ef4444' }}>
                    <span style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: 800 }}>{absent}</span>
                    <span style={s.statLabel}>Absent</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#f59e0b' }}>
                    <span style={{ color: '#f59e0b', fontSize: '1.8rem', fontWeight: 800 }}>{late}</span>
                    <span style={s.statLabel}>Late</span>
                </div>
            </div>

            {/* Progress bar */}
            {records.length > 0 && (
                <div style={s.progressWrap}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>Attendance Progress</span>
                        <span style={{ color: pct >= 75 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{pct}% {pct < 75 ? '⚠️ Below 75%' : '✅'}</span>
                    </div>
                    <div style={s.progressBar}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            style={{ ...s.progressFill, background: pct >= 75 ? '#10b981' : '#ef4444' }} />
                    </div>
                </div>
            )}

            {/* Filter */}
            <div style={s.filters}>
                {['all', 'present', 'absent', 'late'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ ...s.filterBtn, ...(filter === f ? { background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)' } : {}) }}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Records */}
            {filtered.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No attendance records found.</p>
            ) : (
                <div style={s.list}>
                    {filtered.map((r, i) => (
                        <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }} style={s.row}>
                            <div style={s.rowLeft}>
                                <div style={{ ...s.statusDot, background: r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b' }} />
                                <div>
                                    <div style={s.rowDate}>{r.date}</div>
                                    <div style={s.rowMeta}>
                                        {r.subject && <span style={s.badge}>{r.subject}</span>}
                                        {r.targetClass && <span style={s.classBadge}>{r.targetClass}{r.section ? ` · ${r.section}` : ''}</span>}
                                        {r.teacherId?.name && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>👨‍🏫 {r.teacherId.name}</span>}
                                        {r.remark && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>"{r.remark}"</span>}
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                ...s.statusBadge,
                                background: r.status === 'present' ? '#10b98120' : r.status === 'absent' ? '#ef444420' : '#f59e0b20',
                                color: r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b',
                            }}>
                                {r.status === 'present' ? '✅ Present' : r.status === 'absent' ? '❌ Absent' : '⏰ Late'}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

const s = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 900, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { background: 'var(--card)', border: '2px solid', borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' },
    progressWrap: { background: 'var(--card)', borderRadius: '12px', padding: '1rem 1.5rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    progressBar: { height: 10, background: 'var(--border)', borderRadius: '20px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '20px' },
    filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
    filterBtn: { padding: '0.45rem 1.1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    row: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    rowLeft: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 },
    statusDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
    rowDate: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
    rowMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' },
    badge: { background: '#6366f120', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    classBadge: { background: '#06b6d420', color: '#06b6d4', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    statusBadge: { padding: '0.3rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' },
};

export default MyAttendance;

