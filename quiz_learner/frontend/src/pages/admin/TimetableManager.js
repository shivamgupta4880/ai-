import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTimetable, getTeachersForTimetable, createTimetableEntry, deleteTimetableEntry } from '../../utils/api';
import Loader from '../../components/Loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_OPTIONS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year'];

const emptyForm = { teacherId: '', targetClass: '', section: '', subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' };

const TimetableManager = () => {
    const [entries, setEntries] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterDay, setFilterDay] = useState('All');
    const [filterClass, setFilterClass] = useState('');

    useEffect(() => {
        Promise.all([getTimetable(), getTeachersForTimetable()])
            .then(([t, tc]) => { setEntries(t.data); setTeachers(tc.data); })
            .catch(() => toast.error('Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.teacherId || !form.targetClass || !form.section || !form.subject)
            return toast.error('Fill all required fields');
        setSaving(true);
        try {
            const { data } = await createTimetableEntry(form);
            setEntries(prev => [...prev, data]);
            setForm(emptyForm);
            setShowForm(false);
            toast.success('Entry added!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await deleteTimetableEntry(id);
            setEntries(prev => prev.filter(e => e._id !== id));
            toast.success('Deleted');
        } catch { toast.error('Delete failed'); }
    };

    const filtered = entries.filter(e =>
        (filterDay === 'All' || e.day === filterDay) &&
        (!filterClass || e.targetClass === filterClass)
    );

    const downloadPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 297, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Class Timetable', 14, 15);
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 15);

        autoTable(doc, {
            startY: 28,
            head: [['Day', 'Class', 'Section', 'Subject', 'Teacher', 'Time', 'Room']],
            body: filtered.map(e => [
                e.day, e.targetClass, e.section, e.subject,
                e.teacherId?.name || '-',
                `${e.startTime} - ${e.endTime}`,
                e.room || '-',
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
        });
        doc.save(`timetable-${Date.now()}.pdf`);
    };

    if (loading) return <Loader />;

    // Group by day for visual display
    const byDay = DAYS.reduce((acc, d) => {
        acc[d] = filtered.filter(e => e.day === d);
        return acc;
    }, {});

    return (
        <div style={s.page}>
            <div style={s.header}>
                <h1 style={s.title}>🗓️ Timetable Manager</h1>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={downloadPDF} style={s.pdfBtn}>📥 Download PDF</button>
                    <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
                        {showForm ? '✕ Cancel' : '+ Add Entry'}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={s.card}>
                    <h2 style={s.sec}>New Timetable Entry</h2>
                    <form onSubmit={handleSave}>
                        <div style={s.grid}>
                            <div>
                                <label style={s.label}>Teacher *</label>
                                <select style={s.input} value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} required>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Class *</label>
                                <select style={s.input} value={form.targetClass} onChange={e => setForm({ ...form, targetClass: e.target.value })} required>
                                    <option value="">Select Class</option>
                                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Section *</label>
                                <input style={s.input} placeholder="e.g. A, B, Science" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required />
                            </div>
                            <div>
                                <label style={s.label}>Subject *</label>
                                <input style={s.input} placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                            </div>
                            <div>
                                <label style={s.label}>Day *</label>
                                <select style={s.input} value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Start Time *</label>
                                <input style={s.input} type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                            </div>
                            <div>
                                <label style={s.label}>End Time *</label>
                                <input style={s.input} type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                            </div>
                            <div>
                                <label style={s.label}>Room</label>
                                <input style={s.input} placeholder="e.g. Room 101" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" style={s.saveBtn} disabled={saving}>
                            {saving ? 'Saving...' : '✅ Add Entry'}
                        </motion.button>
                    </form>
                </motion.div>
            )}

            {/* Filters */}
            <div style={s.filters}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['All', ...DAYS].map(d => (
                        <button key={d} onClick={() => setFilterDay(d)}
                            style={{ ...s.filterBtn, ...(filterDay === d ? { background: 'var(--primary)', color: '#fff' } : {}) }}>
                            {d}
                        </button>
                    ))}
                </div>
                <select style={s.input} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                    <option value="">All Classes</option>
                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Timetable Grid by Day */}
            {DAYS.filter(d => filterDay === 'All' || d === filterDay).map(day => (
                byDay[day]?.length > 0 && (
                    <div key={day} style={s.daySection}>
                        <h3 style={s.dayTitle}>{day}</h3>
                        <div style={s.entryGrid}>
                            {byDay[day].map(e => (
                                <motion.div key={e._id} whileHover={{ y: -3 }} style={s.entryCard}>
                                    <div style={s.entryTime}>{e.startTime} – {e.endTime}</div>
                                    <div style={s.entrySubject}>{e.subject}</div>
                                    <div style={s.entryMeta}>
                                        <span style={s.classBadge}>{e.targetClass} · {e.section}</span>
                                        <span style={s.teacherBadge}>👨‍🏫 {e.teacherId?.name}</span>
                                        {e.room && <span style={s.roomBadge}>🚪 {e.room}</span>}
                                    </div>
                                    <button onClick={() => handleDelete(e._id)} style={s.delBtn}>✕</button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            ))}
            {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No timetable entries found.</p>}
        </div>
    );
};

const s = {
    page: { padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    addBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    pdfBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '1.8rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    sec: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
    label: { display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' },
    input: { padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
    saveBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' },
    filters: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' },
    filterBtn: { padding: '0.4rem 1rem', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', fontSize: '0.82rem' },
    daySection: { marginBottom: '1.5rem' },
    dayTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.8rem', padding: '0.4rem 1rem', background: '#6366f115', borderRadius: '8px', display: 'inline-block' },
    entryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem' },
    entryCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', position: 'relative' },
    entryTime: { fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.3rem' },
    entrySubject: { fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginBottom: '0.5rem' },
    entryMeta: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
    classBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 },
    teacherBadge: { background: '#10b98120', color: '#10b981', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 },
    roomBadge: { background: '#f59e0b20', color: '#f59e0b', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 },
    delBtn: { position: 'absolute', top: '0.6rem', right: '0.6rem', background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' },
};

export default TimetableManager;
