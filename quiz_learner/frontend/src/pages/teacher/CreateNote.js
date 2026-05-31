import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createNote, deleteNote, getTeacherNotes, aiGenerateNote, uploadPDFNote } from '../../utils/api';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year',
];

const COURSE_OPTIONS = {
    'College 1st Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 2nd Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 3rd Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
    'College 4th Year': ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other'],
};

const isCollege = (cls) => cls?.startsWith('College');

const CreateNote = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', content: '', subject: '', targetClass: '', course: '', section: '', tags: '' });
    const [saving, setSaving] = useState(false);
    const [aiForm, setAiForm] = useState({ subject: '', topic: '', targetClass: '', course: '', section: '' });
    const [aiLoading, setAiLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [pdfForm, setPdfForm] = useState({ title: '', subject: '', targetClass: '', course: '', section: '', tags: '' });
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [showPdfForm, setShowPdfForm] = useState(false);

    const fetchNotes = () => {
        getTeacherNotes().then(({ data }) => setNotes(data)).finally(() => setLoading(false));
    };

    useEffect(() => { fetchNotes(); }, []);

    const handleAIGenerate = async () => {
        if (!aiForm.subject || !aiForm.topic || !aiForm.targetClass)
            return toast.error('Please fill subject, topic and class');
        setAiLoading(true);
        try {
            const { data } = await aiGenerateNote(aiForm);
            setForm((prev) => ({
                ...prev,
                content: data.content,
                subject: aiForm.subject,
                targetClass: aiForm.targetClass,
                course: aiForm.course,
                section: aiForm.section,
                title: aiForm.topic,
            }));
            setShowForm(true);
            toast.success('AI generated notes! Edit and save.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI generation failed');
        } finally { setAiLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.content || !form.subject || !form.targetClass)
            return toast.error('Please fill all required fields');
        setSaving(true);
        try {
            const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
            await createNote({ ...form, tags });
            toast.success('Note created successfully!');
            setForm({ title: '', content: '', subject: '', targetClass: '', course: '', section: '', tags: '' });
            setShowForm(false);
            fetchNotes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await deleteNote(id);
            setNotes((prev) => prev.filter((n) => n._id !== id));
            toast.success('Note deleted');
        } catch { toast.error('Delete failed'); }
    };

    const handlePDFUpload = async (e) => {
        e.preventDefault();
        if (!pdfFile) return toast.error('Please select a PDF file');
        if (!pdfForm.title || !pdfForm.subject || !pdfForm.targetClass)
            return toast.error('Please fill title, subject and class');
        setPdfUploading(true);
        try {
            const formData = new FormData();
            formData.append('pdf', pdfFile);
            formData.append('title', pdfForm.title);
            formData.append('subject', pdfForm.subject);
            formData.append('targetClass', pdfForm.targetClass);
            formData.append('course', pdfForm.course);
            formData.append('section', pdfForm.section);
            formData.append('tags', pdfForm.tags);
            await uploadPDFNote(formData);
            toast.success('PDF uploaded successfully!');
            setPdfForm({ title: '', subject: '', targetClass: '', course: '', section: '', tags: '' });
            setPdfFile(null);
            setShowPdfForm(false);
            fetchNotes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally { setPdfUploading(false); }
    };

    if (loading) return <Loader />;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>📝 Manage Notes</h1>
                <button onClick={() => setShowForm(!showForm)} style={styles.toggleBtn}>
                    {showForm ? '✕ Cancel' : '+ Create Note'}
                </button>
            </div>

            {/* AI Generator */}
            <div style={styles.aiCard}>
                <h2 style={styles.sectionTitle}>🤖 Generate Notes with AI</h2>
                <p style={styles.aiDesc}>Enter topic and class — AI will automatically generate notes</p>
                <div style={styles.aiRow}>
                    <input style={styles.input} placeholder="Subject (e.g. Mathematics)" value={aiForm.subject}
                        onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })} />
                    <input style={styles.input} placeholder="Topic (e.g. Quadratic Equations)" value={aiForm.topic}
                        onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })} />
                    <select style={styles.input} value={aiForm.targetClass}
                        onChange={(e) => setAiForm({ ...aiForm, targetClass: e.target.value, course: '' })}>
                        <option value="">Select class</option>
                        {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {isCollege(aiForm.targetClass) && (
                        <select style={styles.input} value={aiForm.course}
                            onChange={(e) => setAiForm({ ...aiForm, course: e.target.value })}>
                            <option value="">Select Course</option>
                            {(COURSE_OPTIONS[aiForm.targetClass] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    <input style={styles.input} placeholder="Section (optional, e.g. A, B)" value={aiForm.section}
                        onChange={(e) => setAiForm({ ...aiForm, section: e.target.value })} />
                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleAIGenerate}
                        style={styles.aiBtn} disabled={aiLoading}>
                        {aiLoading ? '⏳ Generating...' : '✨ Generate Notes'}
                    </motion.button>
                </div>
            </div>

            {/* PDF Upload */}
            <div style={styles.pdfCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h2 style={styles.sectionTitle}>📄 Upload PDF Note</h2>
                    <button onClick={() => setShowPdfForm(!showPdfForm)} style={styles.toggleBtn}>
                        {showPdfForm ? '✕ Cancel' : '+ Upload PDF'}
                    </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upload a PDF file as a note for a specific class</p>
                {showPdfForm && (
                    <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        onSubmit={handlePDFUpload} style={{ marginTop: '1.2rem' }}>
                        <div style={styles.formGrid}>
                            <input style={styles.input} placeholder="Note title *" value={pdfForm.title}
                                onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })} required />
                            <input style={styles.input} placeholder="Subject *" value={pdfForm.subject}
                                onChange={(e) => setPdfForm({ ...pdfForm, subject: e.target.value })} required />
                            <select style={styles.input} value={pdfForm.targetClass}
                                onChange={(e) => setPdfForm({ ...pdfForm, targetClass: e.target.value, course: '' })} required>
                                <option value="">Target Class *</option>
                                {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {isCollege(pdfForm.targetClass) && (
                                <select style={styles.input} value={pdfForm.course}
                                    onChange={(e) => setPdfForm({ ...pdfForm, course: e.target.value })}>
                                    <option value="">Select Course</option>
                                    {(COURSE_OPTIONS[pdfForm.targetClass] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                            <input style={styles.input} placeholder="Section (optional, e.g. A, B, Science)" value={pdfForm.section}
                                onChange={(e) => setPdfForm({ ...pdfForm, section: e.target.value })} />
                            <input style={styles.input} placeholder="Tags (comma separated)" value={pdfForm.tags}
                                onChange={(e) => setPdfForm({ ...pdfForm, tags: e.target.value })} />
                        </div>
                        <div style={styles.fileInputWrap}>
                            <label style={styles.fileLabel}>
                                <span>📎 {pdfFile ? pdfFile.name : 'Choose PDF file (max 10MB)'}</span>
                                <input type="file" accept=".pdf" style={{ display: 'none' }}
                                    onChange={(e) => setPdfFile(e.target.files[0])} />
                            </label>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.submitBtn} disabled={pdfUploading}>
                            {pdfUploading ? '⏳ Uploading...' : '📤 Upload PDF'}
                        </motion.button>
                    </motion.form>
                )}
            </div>

            {/* Create Text Note Form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={styles.card}>
                    <h2 style={styles.sectionTitle}>Note Details</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGrid}>
                            <input style={styles.input} placeholder="Title *" value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            <input style={styles.input} placeholder="Subject *" value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                            <select style={styles.input} value={form.targetClass}
                                onChange={(e) => setForm({ ...form, targetClass: e.target.value, course: '' })} required>
                                <option value="">Target Class *</option>
                                {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {isCollege(form.targetClass) && (
                                <select style={styles.input} value={form.course}
                                    onChange={(e) => setForm({ ...form, course: e.target.value })}>
                                    <option value="">Select Course</option>
                                    {(COURSE_OPTIONS[form.targetClass] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                            <input style={styles.input} placeholder="Section (optional, e.g. A, B, Science)" value={form.section}
                                onChange={(e) => setForm({ ...form, section: e.target.value })} />
                            <input style={styles.input} placeholder="Tags (comma separated, optional)" value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                        </div>
                        <textarea
                            style={styles.textarea}
                            placeholder="Note content * (Markdown supported: ## Heading, - bullet, **bold**)"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            required
                        />
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" style={styles.submitBtn} disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save Note'}
                        </motion.button>
                    </form>
                </motion.div>
            )}

            {/* Notes List */}
            <h2 style={styles.sectionTitle}>My Notes ({notes.length})</h2>
            <div style={styles.notesList}>
                {notes.map((note) => (
                    <motion.div key={note._id} whileHover={{ x: 4 }} style={styles.noteItem}>
                        <div style={styles.noteLeft}>
                            <div style={styles.noteTitle}>{note.title}</div>
                            <div style={styles.noteMeta}>
                                <span style={styles.classBadge}>{note.targetClass}</span>
                                {note.course && <span style={styles.courseBadge}>📚 {note.course}</span>}
                                {note.section && <span style={styles.sectionBadge}>§ {note.section}</span>}
                                <span style={styles.subjectBadge}>{note.subject}</span>
                                {note.pdfUrl && <span style={{ background: '#ef444420', color: '#ef4444', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>📄 PDF</span>}
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    👨‍🏫 {note.teacherId?.name || 'You'}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(note._id)} style={styles.deleteBtn}>🗑 Delete</button>
                    </motion.div>
                ))}
                {notes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No notes yet.</p>}
            </div>
        </div>
    );
};

const styles = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1000, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    toggleBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    aiCard: { background: 'linear-gradient(135deg, #6366f115, #06b6d415)', border: '2px solid var(--primary)', borderRadius: '16px', padding: '1.8rem', marginBottom: '1.5rem' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.8rem' },
    aiDesc: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' },
    aiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end' },
    aiBtn: { background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    card: { background: 'var(--card)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', marginBottom: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%' },
    textarea: { width: '100%', minHeight: 200, padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'monospace', marginBottom: '1rem' },
    submitBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
    notesList: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
    noteItem: { background: 'var(--card)', borderRadius: '12px', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.8rem' },
    noteLeft: { flex: 1 },
    noteTitle: { fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' },
    noteMeta: { display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' },
    classBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    subjectBadge: { background: '#10b98120', color: '#10b981', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    sectionBadge: { background: '#f59e0b20', color: '#f59e0b', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    courseBadge: { background: '#06b6d420', color: '#06b6d4', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    deleteBtn: { background: '#ef444420', color: '#ef4444', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
    pdfCard: { background: 'linear-gradient(135deg,#10b98110,#06b6d410)', border: '2px solid #10b981', borderRadius: '16px', padding: '1.8rem', marginBottom: '1.5rem' },
    fileInputWrap: { marginBottom: '1rem' },
    fileLabel: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1.2rem', borderRadius: '10px', border: '2px dashed var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.95rem', background: 'var(--bg)' },
};

export default CreateNote;

