import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getMyNotes, setStudentClass } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const MyNotes = () => {
    const { user, login } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(user?.studentClass || '');
    const [collegeCourse, setCollegeCourse] = useState(user?.collegeCourse || '');
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);

    const isCollege = selectedClass.toLowerCase().includes('college');

    const fetchNotes = () => {
        if (!user?.studentClass) { setLoading(false); return; }
        setLoading(true);
        getMyNotes()
            .then(({ data }) => setNotes(data.notes))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchNotes(); }, [user?.studentClass]);

    const handleSaveClass = async () => {
        if (!selectedClass) return toast.error('Select your class');
        if (isCollege && !collegeCourse.trim()) return toast.error('Please enter your course name (e.g. B.Tech, BCA)');
        setSaving(true);
        try {
            const { data } = await setStudentClass({
                studentClass: selectedClass,
                collegeCourse: isCollege ? collegeCourse.trim() : '',
            });
            const stored = JSON.parse(localStorage.getItem('quizUser'));
            const updated = { ...stored, studentClass: data.studentClass, collegeCourse: data.collegeCourse };
            localStorage.setItem('quizUser', JSON.stringify(updated));
            login(updated);
            toast.success(`Class set: ${selectedClass}${data.collegeCourse ? ` · ${data.collegeCourse}` : ''}`);
            fetchNotes();
        } catch { toast.error('Failed to save class'); }
        finally { setSaving(false); }
    };

    const filtered = notes.filter(
        (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.subject.toLowerCase().includes(search.toLowerCase())
    );

    // Group by subject
    const grouped = filtered.reduce((acc, note) => {
        if (!acc[note.subject]) acc[note.subject] = [];
        acc[note.subject].push(note);
        return acc;
    }, {});

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>📚 My Notes</h1>

            {/* Class Setup Card */}
            <div style={styles.classCard}>
                <div style={styles.classLeft}>
                    <span style={styles.classIcon}>🎓</span>
                    <div>
                        <div style={styles.classLabel}>Your Class</div>
                        <div style={styles.classValue}>
                            {user?.studentClass || 'Not set yet'}
                            {user?.collegeCourse && <span style={styles.courseBadge}>{user.collegeCourse}</span>}
                        </div>
                    </div>
                </div>
                <div style={styles.classRight}>
                    <select style={styles.select} value={selectedClass}
                        onChange={(e) => { setSelectedClass(e.target.value); setCollegeCourse(''); }}>
                        <option value="">Select class</option>
                        {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {isCollege && (
                        <input
                            style={styles.courseInput}
                            placeholder="Course name (e.g. B.Tech, BCA, MBA...)"
                            value={collegeCourse}
                            onChange={(e) => setCollegeCourse(e.target.value)}
                        />
                    )}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveClass}
                        style={styles.saveBtn} disabled={saving}>
                        {saving ? 'Saving...' : user?.studentClass ? '🔄 Change' : '✅ Set Class'}
                    </motion.button>
                </div>
            </div>

            {!user?.studentClass ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
                    <div style={{ fontSize: '4rem' }}>📖</div>
                    <h3>Set your class first</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Select your class above to see notes for your class</p>
                </motion.div>
            ) : loading ? (
                <Loader text="Loading notes..." />
            ) : (
                <>
                    {/* Search */}
                    <input
                        style={styles.search}
                        placeholder="🔍 Search notes by title or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {Object.keys(grouped).length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
                            <div style={{ fontSize: '4rem' }}>📭</div>
                            <h3>{user.studentClass} has no notes yet</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Notes will appear here when your teacher adds them</p>
                        </motion.div>
                    ) : (
                        Object.entries(grouped).map(([subject, subjectNotes]) => (
                            <div key={subject} style={styles.subjectSection}>
                                <h2 style={styles.subjectTitle}>
                                    <span style={styles.subjectDot} />
                                    {subject}
                                    <span style={styles.noteCount}>{subjectNotes.length} notes</span>
                                </h2>
                                <div style={styles.notesGrid}>
                                    {subjectNotes.map((note) => (
                                        <motion.div
                                            key={note._id}
                                            whileHover={{ y: -4 }}
                                            style={styles.noteCard}
                                            onClick={() => setExpanded(expanded === note._id ? null : note._id)}
                                        >
                                            <div style={styles.noteHeader}>
                                                <h3 style={styles.noteTitle}>{note.title}</h3>
                                                <span style={styles.expandIcon}>{expanded === note._id ? '▲' : '▼'}</span>
                                            </div>
                                            <div style={styles.noteMeta}>
                                                <span>👨‍🏫 {note.teacherId?.name || 'Unknown Teacher'}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString('en-IN')}</span>
                                                {note.pdfUrl && <span style={styles.pdfBadge}>📄 PDF</span>}
                                            </div>
                                            {note.tags?.length > 0 && (
                                                <div style={styles.tags}>
                                                    {note.tags.map((t, i) => <span key={i} style={styles.tag}>{t}</span>)}
                                                </div>
                                            )}
                                            <AnimatePresence>
                                                {expanded === note._id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        style={styles.noteContent}
                                                    >
                                                        {note.pdfUrl ? (
                                                            <div style={styles.pdfActions}>
                                                                <a href={`http://localhost:5000${note.pdfUrl}`} target="_blank" rel="noreferrer" style={styles.viewBtn}>
                                                                    👁 View PDF
                                                                </a>
                                                                <a href={`http://localhost:5000${note.pdfUrl}`} download={note.pdfName || 'note.pdf'} style={styles.downloadBtn}>
                                                                    ⬇ Download PDF
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div style={styles.contentText}>
                                                                {note.content.split('\n').map((line, i) => (
                                                                    <p key={i} style={{
                                                                        fontWeight: line.startsWith('##') ? 700 : line.startsWith('###') ? 600 : 400,
                                                                        fontSize: line.startsWith('##') ? '1.1rem' : '0.95rem',
                                                                        marginBottom: '0.3rem',
                                                                        paddingLeft: line.startsWith('-') ? '1rem' : 0,
                                                                        color: 'var(--text)',
                                                                    }}>
                                                                        {line.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '')}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 1100, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    classCard: { background: 'linear-gradient(135deg, #6366f115, #06b6d415)', border: '2px solid var(--primary)', borderRadius: '20px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
    classLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
    classIcon: { fontSize: '2.5rem' },
    classLabel: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 },
    classValue: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' },
    classRight: { display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' },
    select: { padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', minWidth: 180 },
    courseInput: { padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid var(--primary)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', minWidth: 220 },
    courseBadge: { marginLeft: '0.6rem', background: 'var(--primary)', color: '#fff', padding: '0.15rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    saveBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    search: { width: '100%', padding: '0.9rem 1.2rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '1rem', marginBottom: '2rem' },
    emptyState: { textAlign: 'center', padding: '4rem 2rem', color: 'var(--text)' },
    subjectSection: { marginBottom: '2.5rem' },
    subjectTitle: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' },
    subjectDot: { width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' },
    noteCount: { fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.7rem', borderRadius: '20px', fontWeight: 500 },
    notesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' },
    noteCard: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', cursor: 'pointer' },
    noteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
    noteTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text)', flex: 1 },
    expandIcon: { color: 'var(--primary)', fontWeight: 700, marginLeft: '0.5rem' },
    noteMeta: { display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' },
    tags: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' },
    tag: { background: 'var(--primary)', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem' },
    noteContent: { overflow: 'hidden', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' },
    contentText: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    pdfBadge: { background: '#ef444420', color: '#ef4444', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 },
    pdfActions: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap', paddingTop: '0.5rem' },
    viewBtn: { background: '#6366f120', color: 'var(--primary)', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' },
    downloadBtn: { background: '#10b98120', color: '#10b981', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' },
};

export default MyNotes;
