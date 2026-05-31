import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMyCodingAttempts } from '../../utils/api';
import Loader from '../../components/Loader';

const STATUS_COLOR = { passed: '#10b981', partial: '#f59e0b', failed: '#ef4444', error: '#ef4444' };

const MyCodingResults = () => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        getMyCodingAttempts()
            .then(({ data }) => setAttempts(data))
            .catch(() => toast.error('Failed to load results'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? attempts : attempts.filter(a => a.status === filter);

    const passed = attempts.filter(a => a.status === 'passed').length;
    const partial = attempts.filter(a => a.status === 'partial').length;
    const failed = attempts.filter(a => a.status === 'failed' || a.status === 'error').length;
    const avgPct = attempts.length
        ? Math.round(attempts.reduce((sum, a) => sum + (a.totalTests > 0 ? (a.testsPassed / a.totalTests) * 100 : 0), 0) / attempts.length)
        : 0;

    // Download all results as PDF
    const downloadAllPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Coding Results Report', 14, 20);

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        doc.text(`Total Submissions: ${attempts.length}   |   Accepted: ${passed}   |   Avg Score: ${avgPct}%`, 14, 45);

        autoTable(doc, {
            startY: 52,
            head: [['#', 'Challenge', 'Language', 'Difficulty', 'Tests Passed', 'Score %', 'Status', 'Date']],
            body: attempts.map((a, i) => [
                i + 1,
                a.challengeId?.title || 'N/A',
                a.language,
                a.challengeId?.difficulty || '-',
                `${a.testsPassed}/${a.totalTests}`,
                a.totalTests > 0 ? `${Math.round((a.testsPassed / a.totalTests) * 100)}%` : '0%',
                a.status.toUpperCase(),
                new Date(a.createdAt).toLocaleDateString(),
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            didParseCell: (data) => {
                if (data.column.index === 6 && data.section === 'body') {
                    const val = data.cell.raw;
                    if (val === 'PASSED') data.cell.styles.textColor = [16, 185, 129];
                    else if (val === 'PARTIAL') data.cell.styles.textColor = [245, 158, 11];
                    else data.cell.styles.textColor = [239, 68, 68];
                }
            },
        });

        doc.save(`coding-results-${Date.now()}.pdf`);
    };

    // Download single attempt PDF
    const downloadSinglePDF = (a) => {
        const doc = new jsPDF();
        const pct = a.totalTests > 0 ? Math.round((a.testsPassed / a.totalTests) * 100) : 0;

        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Coding Submission Result', 14, 20);

        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Challenge: ${a.challengeId?.title || 'N/A'}`, 14, 40);
        doc.text(`Language: ${a.language}   |   Difficulty: ${a.challengeId?.difficulty || '-'}`, 14, 48);
        doc.text(`Tests Passed: ${a.testsPassed} / ${a.totalTests}`, 14, 56);
        doc.text(`Score: ${pct}%`, 14, 64);
        doc.text(`Status: ${a.status.toUpperCase()}`, 14, 72);
        doc.text(`Execution Time: ${a.executionTime}ms`, 14, 80);
        doc.text(`Submitted: ${new Date(a.createdAt).toLocaleString()}`, 14, 88);

        // Score bar visual
        doc.setFontSize(10);
        doc.text('Score:', 14, 100);
        doc.setFillColor(230, 230, 230);
        doc.rect(14, 103, 120, 8, 'F');
        const barColor = pct >= 100 ? [16, 185, 129] : pct >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(...barColor);
        doc.rect(14, 103, (120 * pct) / 100, 8, 'F');
        doc.setTextColor(60, 60, 60);
        doc.text(`${pct}%`, 138, 110);

        // Code section
        if (a.code) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Submitted Code:', 14, 122);
            doc.setFont('courier', 'normal');
            doc.setFontSize(8);
            const codeLines = doc.splitTextToSize(a.code, 180);
            const maxLines = Math.min(codeLines.length, 40);
            doc.text(codeLines.slice(0, maxLines), 14, 130);
        }

        doc.save(`coding-${a.challengeId?.title || 'result'}-${Date.now()}.pdf`);
    };

    if (loading) return <Loader />;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>💻 My Coding Results</h1>
                    <p style={s.sub}>{attempts.length} total submissions</p>
                </div>
                {attempts.length > 0 && (
                    <button onClick={downloadAllPDF} style={s.pdfBtn}>📥 Download All Results</button>
                )}
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
                <div style={{ ...s.statCard, borderColor: 'var(--primary)' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '1.6rem', fontWeight: 800 }}>{avgPct}%</span>
                    <span style={s.statLabel}>Avg Score</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#10b981' }}>
                    <span style={{ color: '#10b981', fontSize: '1.6rem', fontWeight: 800 }}>{passed}</span>
                    <span style={s.statLabel}>✅ Accepted</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#f59e0b' }}>
                    <span style={{ color: '#f59e0b', fontSize: '1.6rem', fontWeight: 800 }}>{partial}</span>
                    <span style={s.statLabel}>⚠️ Partial</span>
                </div>
                <div style={{ ...s.statCard, borderColor: '#ef4444' }}>
                    <span style={{ color: '#ef4444', fontSize: '1.6rem', fontWeight: 800 }}>{failed}</span>
                    <span style={s.statLabel}>❌ Failed</span>
                </div>
            </div>

            {/* Filter */}
            <div style={s.filters}>
                {['all', 'passed', 'partial', 'failed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ ...s.filterBtn, ...(filter === f ? { background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)' } : {}) }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div style={s.empty}>
                    <p>No submissions yet.</p>
                    <Link to="/student/coding" style={s.solveBtn}>Start Solving →</Link>
                </div>
            ) : (
                <div style={s.list}>
                    {filtered.map((a, i) => {
                        const pct = a.totalTests > 0 ? Math.round((a.testsPassed / a.totalTests) * 100) : 0;
                        return (
                            <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }} style={s.row}>
                                <div style={s.rowLeft}>
                                    <div style={{ ...s.statusDot, background: STATUS_COLOR[a.status] }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={s.rowTitle}>{a.challengeId?.title || 'Challenge'}</div>
                                        <div style={s.rowMeta}>
                                            <span style={s.langBadge}>{a.language}</span>
                                            {a.challengeId?.difficulty && (
                                                <span style={{ ...s.diffBadge, color: a.challengeId.difficulty === 'easy' ? '#10b981' : a.challengeId.difficulty === 'medium' ? '#f59e0b' : '#ef4444', background: (a.challengeId.difficulty === 'easy' ? '#10b981' : a.challengeId.difficulty === 'medium' ? '#f59e0b' : '#ef4444') + '20' }}>
                                                    {a.challengeId.difficulty}
                                                </span>
                                            )}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>⏱ {a.executionTime}ms</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {/* Score bar */}
                                        <div style={s.barWrap}>
                                            <div style={{ ...s.barFill, width: `${pct}%`, background: STATUS_COLOR[a.status] }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={s.rowRight}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ ...s.scoreBig, color: STATUS_COLOR[a.status] }}>{pct}%</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.testsPassed}/{a.totalTests} tests</div>
                                    </div>
                                    <span style={{ ...s.statusBadge, background: STATUS_COLOR[a.status] + '20', color: STATUS_COLOR[a.status] }}>
                                        {a.status === 'passed' ? '✅ Accepted' : a.status === 'partial' ? '⚠️ Partial' : '❌ Failed'}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <button onClick={() => downloadSinglePDF(a)} style={s.dlBtn}>📥 PDF</button>
                                        <Link to={`/student/coding/${a.challengeId?._id}`} style={s.retryBtn}>↺ Retry</Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const s = {
    page: { padding: '2rem 3rem', maxWidth: 1000, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' },
    sub: { color: 'var(--text-muted)', fontSize: '0.9rem' },
    pdfBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { background: 'var(--card)', border: '2px solid', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' },
    filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
    filterBtn: { padding: '0.45rem 1.1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
    empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' },
    solveBtn: { display: 'inline-block', marginTop: '1rem', background: 'var(--primary)', color: '#fff', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600 },
    list: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    row: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    rowLeft: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 200 },
    statusDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
    rowTitle: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
    rowMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' },
    langBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    diffBadge: { padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' },
    barWrap: { height: 6, background: 'var(--border)', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: 300 },
    barFill: { height: '100%', borderRadius: '20px', transition: 'width 0.5s ease' },
    rowRight: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    scoreBig: { fontSize: '1.4rem', fontWeight: 800 },
    statusBadge: { padding: '0.3rem 0.9rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' },
    dlBtn: { background: '#6366f120', color: 'var(--primary)', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', textAlign: 'center' },
    retryBtn: { background: '#10b98120', color: '#10b981', padding: '0.35rem 0.8rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', textAlign: 'center' },
};

export default MyCodingResults;
