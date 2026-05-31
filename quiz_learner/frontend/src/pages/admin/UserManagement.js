import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAllUsers, deleteUser, updateUser } from '../../utils/api';
import Loader from '../../components/Loader';

const CLASS_OPTIONS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year'];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [editUser, setEditUser] = useState(null); // user being edited
    const [editForm, setEditForm] = useState({ studentClass: '', section: '' });
    const [saving, setSaving] = useState(false);

    const fetchUsers = () => {
        getAllUsers()
            .then(({ data }) => setUsers(data))
            .catch(() => toast.error('Failed to load users'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await deleteUser(id);
            toast.success('User deleted');
            setUsers((prev) => prev.filter((u) => u._id !== id));
        } catch { toast.error('Delete failed'); }
    };

    const handleToggleActive = async (user) => {
        try {
            const { data } = await updateUser(user._id, { isActive: !user.isActive });
            setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
            toast.success('User updated');
        } catch { toast.error('Update failed'); }
    };

    const openEdit = (user) => {
        setEditUser(user);
        setEditForm({ studentClass: user.studentClass || '', section: user.section || '', collegeCourse: user.collegeCourse || '' });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const { data } = await updateUser(editUser._id, {
                studentClass: editForm.studentClass.trim(),
                section: editForm.section.trim(),
                collegeCourse: (editForm.collegeCourse || '').trim(),
            });
            setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
            toast.success('Student profile updated');
            setEditUser(null);
        } catch { toast.error('Update failed'); }
        finally { setSaving(false); }
    };

    const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

    if (loading) return <Loader />;

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>User Management</h1>
            <div style={styles.filters}>
                {['all', 'student', 'teacher', 'admin'].map((r) => (
                    <button key={r} onClick={() => setFilter(r)}
                        style={{ ...styles.filterBtn, background: filter === r ? 'var(--primary)' : 'var(--card)', color: filter === r ? '#fff' : 'var(--text)' }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                ))}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.overlay}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={styles.modal}>
                            <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Edit Student Profile</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>{editUser.name} · {editUser.email}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={styles.label}>Class</label>
                                    <input style={styles.input} list="class-opts-modal" placeholder="e.g. College 1st Year"
                                        value={editForm.studentClass} onChange={e => setEditForm({ ...editForm, studentClass: e.target.value, collegeCourse: '' })} />
                                    <datalist id="class-opts-modal">
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                {editForm.studentClass?.startsWith('College') && (
                                    <div>
                                        <label style={styles.label}>Course</label>
                                        <select style={styles.input} value={editForm.collegeCourse || ''}
                                            onChange={e => setEditForm({ ...editForm, collegeCourse: e.target.value })}>
                                            <option value="">Select Course</option>
                                            {['B.Tech', 'BCA', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MBA', 'MCA', 'M.Tech', 'Other']
                                                .map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={styles.label}>Section</label>
                                    <input style={styles.input} placeholder="e.g. K22DFO, A, B"
                                        value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                                <button onClick={handleSaveEdit} style={styles.saveBtn} disabled={saving}>
                                    {saving ? 'Saving...' : '✅ Save'}
                                </button>
                                <button onClick={() => setEditUser(null)} style={styles.cancelBtn}>Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Class · Section</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Joined</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u) => (
                            <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.row}>
                                <td style={styles.td}>{u.name}</td>
                                <td style={styles.td}>{u.email}</td>
                                <td style={styles.td}>
                                    <span style={{ ...styles.badge, background: u.role === 'admin' ? '#ef4444' : u.role === 'teacher' ? '#f59e0b' : '#10b981' }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    {u.role === 'student' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.82rem', color: u.studentClass ? 'var(--text)' : '#ef4444', fontWeight: u.studentClass ? 400 : 600 }}>
                                                {u.studentClass || '⚠️ Not set'}
                                                {u.collegeCourse ? ` · ${u.collegeCourse}` : ''}
                                                {u.section ? ` · ${u.section}` : ''}
                                            </span>
                                            <button onClick={() => openEdit(u)} style={styles.editBtn} title="Edit class/section">✏️</button>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td style={styles.td}>
                                    <span style={{ color: u.isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td style={styles.td}>
                                    {u.email === 'nitishkumarpandey05@gmail.com' ? (
                                        <span style={styles.protectedBadge}>🔒 Protected</span>
                                    ) : (
                                        <>
                                            <button onClick={() => handleToggleActive(u)} style={styles.actionBtn}>
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(u._id)}
                                                style={{ ...styles.actionBtn, background: '#ef444420', color: '#ef4444' }}>
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' },
    filters: { display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    filterBtn: { padding: '0.5rem 1.2rem', borderRadius: '20px', border: '1px solid var(--border)', fontWeight: 500, cursor: 'pointer' },
    tableWrap: { overflowX: 'auto', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: 'var(--primary)', color: '#fff' },
    th: { padding: '1rem 1.2rem', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem' },
    row: { borderBottom: '1px solid var(--border)' },
    td: { padding: '0.9rem 1.2rem', color: 'var(--text)', fontSize: '0.88rem' },
    badge: { color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    actionBtn: { background: '#6366f120', color: 'var(--primary)', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', marginRight: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.8rem' },
    editBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' },
    protectedBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--card)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: 420, border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    label: { display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' },
    input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
    saveBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', flex: 1 },
    cancelBtn: { background: 'var(--bg)', color: 'var(--text)', border: '1.5px solid var(--border)', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
};

export default UserManagement;
