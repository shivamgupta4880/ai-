import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { bulkMarkAttendance, getStudentsByClass, getAttendanceReport } from '../../utils/api';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const AttendancePortal = () => {
    const [tab, setTab] = useState('mark'); // mark | report
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], subject: '', targetClass: '', section: '' });
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState({}); // { studentId: { status, remark } }
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [report, setReport] = useState([]);
    const [reportFilter, setReportFilter] = useState({ date: '', targetClass: '', section: '', subject: '' });
    const [reportLoading, setReportLoading] = useState(false);

    const fetchStudents = async () => {
        if (!form.targetClass) return toast.error('Select a class first');
        setLoadingStudents(true);
        try {
            const { data } = await getStudentsByClass({ targetClass: form.targetClass, section: form.section });
            setStudents(data);
            const init = {};
            data.forEach(s => { init[s._id] = { status: 'present', remark: '' }; });
            setRecords(init);
            if (data.length === 0) toast('No students found for this class', { icon: 'ℹ️' });
        } catch { toast.error('Failed to load students'); }
        finally { setLoadingStudents(false); }
    };

    const setAll = (status) => {
        const updated = {};
        students.forEach(s => { updated[s._id] = { ...records[s._id], status }; });
        setRecords(updated);
    };

    const handleSave = async () => {
        if (!students.length) return toast.error('Load students first');
        setSaving(true);
        try {
            const recordsArr = students.map(s => ({
                studentId: s._id,
                status: records[s._id]?.status || 'present',
                remark: records[s._id]?.remark || '',
            }));
            await bulkMarkAttendance({ ...form, records: recordsArr });
            toast.success('Attendance saved!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    const fetchReport = async () => {
        setReportLoading(true);
        try {
            const { data } = await getAttendanceReport(reportFilter);
            setReport(data);
        } catch { toast.error('Failed to load report'); }
        finally { setReportLoading(false); }
    };

    useEffect(() => { if (tab === 'report') fetchReport(); }, [tab]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Attendance Report', 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        if (reportFilter.date) doc.text(`Date: ${reportFilter.date}`, 14, 26);
        if (reportFilter.targetClass) doc.text(`Class: ${reportFilter.targetClass}${reportFilter.section ? ' · ' + reportFilter.section : ''}`, 14, 32);
        if (reportFilter.subject) doc.text(`Subject: ${reportFilter.subject}`, 14, 38);

        autoTable(doc, {
            startY: 44,
            head: [['#', 'Student', 'Date', 'Subject', 'Class', 'Status', 'Remark']],
            body: report.map((r, i) => [
                i + 1,
                r.studentId?.name || 'N/A',
                r.date,
                r.subject || '-',
                r.targetClass + (r.section ? ' · ' + r.section : ''),
                r.status.toUpperCase(),
                r.remark || '-',
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            columnStyles: { 5: { fontStyle: 'bold' } },
        });
        doc.save(`attendance-report-${Date.now()}.pdf`);
    };

    const presentCount = report.filter(r => r.status === 'present').length;
    const absentCount = report.filter(r => r.status === 'absent').length;
    const lateCount = report.filter(r => r.status === 'late').length;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <h1 style={s.title}>📋 Attendance Portal</h1>
                <div style={s.tabs}>
                    <button style={{ ...s.tab, ...(tab === 'mark' ? s.tabActive : {}) }} onClick={() => setTab('mark')}>✏️ Mark Attendance</button>
                    <button style={{ ...s.tab, ...(tab === 'report' ? s.tabActive : {}) }} onClick={() => setTab('report')}>📊 View Report</button>
                </div>
            </div>

            {/* MARK ATTENDANCE */}
            {tab === 'mark' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={s.card}>
                        <h2 style={s.sec}>Session Details</h2>
                        <div style={s.grid}>
                            <div>
                                <label style={s.label}>Date *</label>
                                <input style={s.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div>
                                <label style={s.label}>Subject</label>
                                <input style={s.input} placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                            </div>
                            <div>
                                <label style={s.label}>Class *</label>
                                <select style={s.input} value={form.targetClass} onChange={e => setForm({ ...form, targetClass: e.target.value })}>
                                    <option value="">Select Class</option>
                                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Section</label>
                                <input style={s.input} placeholder="e.g. A, B, Science" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={fetchStudents} style={s.loadBtn} disabled={loadingStudents}>
                            {loadingStudents ? '⏳ Loading...' : '🔍 Load Students'}
                        </motion.button>
                    </div>

                    {students.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                                <h2 style={s.sec}>{students.length} Students — {form.targetClass}{form.section ? ` · ${form.section}` : ''}</h2>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setAll('present')} style={{ ...s.quickBtn, background: '#10b98120', color: '#10b981' }}>✅ All Present</button>
                                    <button onClick={() => setAll('absent')} style={{ ...s.quickBtn, background: '#ef444420', color: '#ef4444' }}>❌ All Absent</button>
                                </div>
                            </div>

                            {/* Summary bar */}
                            <div style={s.summaryBar}>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Present: {Object.values(records).filter(r => r.status === 'present').length}</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ Absent: {Object.values(records).filter(r => r.status === 'absent').length}</span>
                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏰ Late: {Object.values(records).filter(r => r.status === 'late').length}</span>
                            </div>

                            <div style={s.studentList}>
                                {students.map((st, i) => (
                                    <div key={st._id} style={s.studentRow}>
                                        <div style={s.studentInfo}>
                                            <span style={s.rollNo}>{i + 1}</span>
                                            <div>
                                                <div style={s.studentName}>{st.name}</div>
                                                <div style={s.studentMeta}>{st.email}</div>
                                            </div>
                                        </div>
                                        <div style={s.statusBtns}>
                                            {['present', 'absent', 'late'].map(status => (
                                                <button key={status} onClick={() => setRecords(r => ({ ...r, [st._id]: { ...r[st._id], status } }))}
                                                    style={{
                                                        ...s.statusBtn,
                                                        background: records[st._id]?.status === status
                                                            ? (status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#f59e0b')
                                                            : 'var(--bg)',
                                                        color: records[st._id]?.status === status ? '#fff' : 'var(--text-muted)',
                                                        border: `1.5px solid ${status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#f59e0b'}`,
                                                    }}>
                                                    {status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏰'} {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <input style={s.remarkInput} placeholder="Remark (optional)" value={records[st._id]?.remark || ''}
                                            onChange={e => setRecords(r => ({ ...r, [st._id]: { ...r[st._id], remark: e.target.value } }))} />
                                    </div>
                                ))}
                            </div>

                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} style={s.saveBtn} disabled={saving}>
                                {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* REPORT */}
            {tab === 'report' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={s.card}>
                        <h2 style={s.sec}>Filter Report</h2>
                        <div style={s.grid}>
                            <div>
                                <label style={s.label}>Date</label>
                                <input style={s.input} type="date" value={reportFilter.date} onChange={e => setReportFilter({ ...reportFilter, date: e.target.value })} />
                            </div>
                            <div>
                                <label style={s.label}>Subject</label>
                                <input style={s.input} placeholder="Subject" value={reportFilter.subject} onChange={e => setReportFilter({ ...reportFilter, subject: e.target.value })} />
                            </div>
                            <div>
                                <label style={s.label}>Class</label>
                                <select style={s.input} value={reportFilter.targetClass} onChange={e => setReportFilter({ ...reportFilter, targetClass: e.target.value })}>
                                    <option value="">All Classes</option>
                                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Section</label>
                                <input style={s.input} placeholder="Section" value={reportFilter.section} onChange={e => setReportFilter({ ...reportFilter, section: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={fetchReport} style={s.loadBtn} disabled={reportLoading}>
                                {reportLoading ? '⏳ Loading...' : '🔍 Apply Filter'}
                            </motion.button>
                            {report.length > 0 && (
                                <button onClick={downloadPDF} style={s.pdfBtn}>📥 Download PDF</button>
                            )}
                        </div>
                    </div>

                    {reportLoading ? <Loader /> : (
                        <>
                            {report.length > 0 && (
                                <div style={s.statsRow}>
                                    <div style={{ ...s.statCard, borderColor: '#10b981' }}><span style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 800 }}>{presentCount}</span><span style={s.statLabel}>Present</span></div>
                                    <div style={{ ...s.statCard, borderColor: '#ef4444' }}><span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 800 }}>{absentCount}</span><span style={s.statLabel}>Absent</span></div>
                                    <div style={{ ...s.statCard, borderColor: '#f59e0b' }}><span style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 800 }}>{lateCount}</span><span style={s.statLabel}>Late</span></div>
                                    <div style={{ ...s.statCard, borderColor: 'var(--primary)' }}><span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>{report.length > 0 ? Math.round((presentCount / report.length) * 100) : 0}%</span><span style={s.statLabel}>Attendance %</span></div>
                                </div>
                            )}

                            <div style={s.tableWrap}>
                                <table style={s.table}>
                                    <thead>
                                        <tr style={s.thead}>
                                            <th style={s.th}>#</th>
                                            <th style={s.th}>Student</th>
                                            <th style={s.th}>Date</th>
                                            <th style={s.th}>Subject</th>
                                            <th style={s.th}>Class</th>
                                            <th style={s.th}>Status</th>
                                            <th style={s.th}>Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.map((r, i) => (
                                            <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={s.td}>{i + 1}</td>
                                                <td style={s.td}><div style={{ fontWeight: 600 }}>{r.studentId?.name}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.studentId?.email}</div></td>
                                                <td style={s.td}>{r.date}</td>
                                                <td style={s.td}>{r.subject || '-'}</td>
                                                <td style={s.td}>{r.targetClass}{r.section ? ` · ${r.section}` : ''}</td>
                                                <td style={s.td}>
                                                    <span style={{ padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: r.status === 'present' ? '#10b98120' : r.status === 'absent' ? '#ef444420' : '#f59e0b20', color: r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b', textTransform: 'capitalize' }}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td style={s.td}>{r.remark || '-'}</td>
                                            </tr>
                                        ))}
                                        {report.length === 0 && (
                                            <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No records found. Apply filter to search.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};

const s = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1100, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    tabs: { display: 'flex', gap: '0.5rem', background: 'var(--bg)', borderRadius: '12px', padding: '4px' },
    tab: { padding: '0.5rem 1.2rem', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' },
    tabActive: { background: 'var(--primary)', color: '#fff', fontWeight: 700 },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '1.8rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    sec: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
    label: { display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
    loadBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    pdfBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    summaryBar: { display: 'flex', gap: '1.5rem', padding: '0.8rem 1rem', background: 'var(--bg)', borderRadius: '10px', marginBottom: '1rem', flexWrap: 'wrap' },
    quickBtn: { padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
    studentList: { display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '60vh', overflowY: 'auto' },
    studentRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)', flexWrap: 'wrap' },
    studentInfo: { display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 180 },
    rollNo: { background: 'var(--primary)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 },
    studentName: { fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' },
    studentMeta: { fontSize: '0.78rem', color: 'var(--text-muted)' },
    statusBtns: { display: 'flex', gap: '0.4rem' },
    statusBtn: { padding: '0.35rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
    remarkInput: { padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '0.82rem', width: 160 },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', width: '100%', marginTop: '1rem', cursor: 'pointer' },
    statsRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    statCard: { flex: 1, minWidth: 120, background: 'var(--card)', border: '2px solid', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 },
    tableWrap: { background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: 'var(--primary)' },
    th: { padding: '0.9rem 1rem', color: '#fff', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' },
    td: { padding: '0.9rem 1rem', color: 'var(--text)', fontSize: '0.88rem' },
};

export default AttendancePortal;

