import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getResultsBySection } from '../../utils/api';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year'];

const SectionResults = () => {
    const [filter, setFilter] = useState({ targetClass: '', section: '', quizId: '' });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchResults = async () => {
        if (!filter.targetClass && !filter.section) return toast.error('Select class or enter section');
        setLoading(true);
        try {
            const params = {};
            if (filter.targetClass) params.targetClass = filter.targetClass.trim();
            if (filter.section) params.section = filter.section.trim();
            if (filter.quizId) params.quizId = filter.quizId.trim();
            const { data } = await getResultsBySection(params);
            setResults(data);
            setSearched(true);
            if (data.length === 0) toast(`No results found. Check if student's class/section matches exactly.`, { icon: 'ℹ️', duration: 4000 });
        } catch { toast.error('Failed to load results'); }
        finally { setLoading(false); }
    };

    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    const passed = results.filter(r => r.score >= 40).length;

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Section-wise Result Report', 14, 20);

        // Sub-header info box
        doc.setFillColor(245, 245, 255);
        doc.rect(14, 38, 182, 28, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Class: ${filter.targetClass || 'All'}`, 18, 47);
        doc.text(`Section: ${filter.section || 'All'}`, 18, 55);
        doc.text(`Total: ${results.length}  |  Avg Score: ${avgScore}%  |  Passed: ${passed}  |  Failed: ${results.length - passed}`, 80, 47);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 80, 55);

        // Score summary bar
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Class Average:', 14, 74);
        doc.setFillColor(220, 220, 220);
        doc.rect(14, 77, 140, 7, 'F');
        const barColor = avgScore >= 85 ? [16, 185, 129] : avgScore >= 65 ? [99, 102, 241] : avgScore >= 40 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(...barColor);
        doc.rect(14, 77, (140 * avgScore) / 100, 7, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(`${avgScore}%`, 158, 83);

        // Results table
        autoTable(doc, {
            startY: 92,
            head: [['#', 'Student Name', 'Email', 'Class · Section', 'Quiz', 'Marks\nObtained', 'Score %', 'Performance', 'Date']],
            body: results.map((r, i) => [
                i + 1,
                r.studentId?.name || 'N/A',
                r.studentId?.email || '-',
                `${r.studentId?.studentClass || '-'} · ${r.studentId?.section || '-'}`,
                r.quizId?.title || '-',
                `${r.correctAnswers}/${r.totalQuestions}`,
                `${r.score}%`,
                (r.performanceLevel || '-').toUpperCase(),
                new Date(r.createdAt).toLocaleDateString(),
            ]),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [99, 102, 241], fontSize: 8, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 248, 255] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                5: { halign: 'center' },
                6: { halign: 'center', fontStyle: 'bold' },
                7: { halign: 'center' },
            },
            didParseCell: (data) => {
                if (data.column.index === 6 && data.section === 'body') {
                    const v = parseInt(data.cell.raw);
                    data.cell.styles.textColor = v >= 85 ? [16, 185, 129] : v >= 65 ? [99, 102, 241] : v >= 40 ? [245, 158, 11] : [239, 68, 68];
                }
                if (data.column.index === 7 && data.section === 'body') {
                    const v = (data.cell.raw || '').toLowerCase();
                    data.cell.styles.textColor = v === 'excellent' ? [16, 185, 129] : v === 'good' ? [99, 102, 241] : v === 'average' ? [245, 158, 11] : [239, 68, 68];
                }
            },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}  |  Quiz Learner — Section Result Report`, 14, doc.internal.pageSize.height - 8);
        }

        doc.save(`results-${filter.targetClass || 'all'}-${filter.section || 'all'}-${Date.now()}.pdf`);
    };

    return (
        <div style={s.page}>
            <h1 style={s.title}>📊 Section-wise Results</h1>

            {/* Filter */}
            <div style={s.card}>
                <h2 style={s.sec}>Filter by Class & Section</h2>
                <div style={s.grid}>
                    <div>
                        <label style={s.label}>Class</label>
                        <input style={s.input} list="class-opts" placeholder="e.g. College 1st Year, Class 10"
                            value={filter.targetClass} onChange={e => setFilter({ ...filter, targetClass: e.target.value })} />
                        <datalist id="class-opts">
                            {CLASS_OPTIONS.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                    <div>
                        <label style={s.label}>Section</label>
                        <input style={s.input} placeholder="e.g. A, B, Science" value={filter.section}
                            onChange={e => setFilter({ ...filter, section: e.target.value })} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={fetchResults} style={s.searchBtn} disabled={loading}>
                        {loading ? '⏳ Loading...' : '🔍 Get Results'}
                    </motion.button>
                    {results.length > 0 && (
                        <button onClick={downloadPDF} style={s.pdfBtn}>📥 Download PDF</button>
                    )}
                </div>
            </div>

            {loading && <Loader />}

            {searched && !loading && (
                <>
                    {/* Stats */}
                    {results.length > 0 && (
                        <div style={s.statsRow}>
                            <div style={{ ...s.statCard, borderColor: 'var(--primary)' }}>
                                <span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>{results.length}</span>
                                <span style={s.statLabel}>Total Results</span>
                            </div>
                            <div style={{ ...s.statCard, borderColor: '#10b981' }}>
                                <span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 800 }}>{avgScore}%</span>
                                <span style={s.statLabel}>Avg Score</span>
                            </div>
                            <div style={{ ...s.statCard, borderColor: '#f59e0b' }}>
                                <span style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 800 }}>{passed}</span>
                                <span style={s.statLabel}>Passed (≥40%)</span>
                            </div>
                            <div style={{ ...s.statCard, borderColor: '#ef4444' }}>
                                <span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 800 }}>{results.length - passed}</span>
                                <span style={s.statLabel}>Failed</span>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div style={s.tableWrap}>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.thead}>
                                    <th style={s.th}>#</th>
                                    <th style={s.th}>Student</th>
                                    <th style={s.th}>Class · Section</th>
                                    <th style={s.th}>Quiz</th>
                                    <th style={s.th}>Marks</th>
                                    <th style={s.th}>Score %</th>
                                    <th style={s.th}>Performance</th>
                                    <th style={s.th}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={s.td}>{i + 1}</td>
                                        <td style={s.td}>
                                            <div style={{ fontWeight: 600 }}>{r.studentId?.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.studentId?.email}</div>
                                        </td>
                                        <td style={s.td}>{r.studentId?.studentClass || '-'} · {r.studentId?.section || '-'}</td>
                                        <td style={s.td}>{r.quizId?.title || '-'}</td>
                                        <td style={s.td}>{r.correctAnswers}/{r.totalQuestions}</td>
                                        <td style={s.td}>
                                            <span style={{ fontWeight: 700, color: r.score >= 85 ? '#10b981' : r.score >= 65 ? '#6366f1' : r.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                                {r.score}%
                                            </span>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{
                                                padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                                                background: r.performanceLevel === 'excellent' ? '#10b98120' : r.performanceLevel === 'good' ? '#6366f120' : r.performanceLevel === 'average' ? '#f59e0b20' : '#ef444420',
                                                color: r.performanceLevel === 'excellent' ? '#10b981' : r.performanceLevel === 'good' ? '#6366f1' : r.performanceLevel === 'average' ? '#f59e0b' : '#ef4444',
                                            }}>{r.performanceLevel}</span>
                                        </td>
                                        <td style={s.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {results.length === 0 && (
                                    <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        <div>No results found.</div>
                                        <div style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
                                            Make sure student's Class and Section in their profile exactly matches what you typed here.
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

const s = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1100, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '1.8rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    sec: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
    label: { display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
    searchBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    pdfBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { background: 'var(--card)', border: '2px solid', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 },
    tableWrap: { background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: 'var(--primary)' },
    th: { padding: '0.9rem 1rem', color: '#fff', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' },
    td: { padding: '0.9rem 1rem', color: 'var(--text)', fontSize: '0.88rem' },
};

export default SectionResults;

