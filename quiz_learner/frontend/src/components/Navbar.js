import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, theme, toggleTheme } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
        setMenuOpen(false);
    };

    const navLinks = {
        admin: [
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/users', label: 'Users' },
            { to: '/admin/analytics', label: 'Analytics' },
            { to: '/admin/timetable', label: '🗓️ Timetable' },
        ],
        teacher: [
            { to: '/teacher', label: 'Dashboard' },
            { to: '/teacher/quizzes', label: 'Quizzes' },
            { to: '/teacher/practice', label: '🎯 Practice' },
            { to: '/teacher/notes', label: 'Notes' },
            { to: '/teacher/coding', label: '💻 Coding' },
            { to: '/teacher/attendance', label: '📋 Attendance' },
            { to: '/teacher/section-results', label: '📊 Results' },
        ],
        student: [
            { to: '/student', label: 'Dashboard' },
            { to: '/student/practice', label: '🎯 Practice' },
            { to: '/student/quizzes', label: 'Quizzes' },
            { to: '/student/notes', label: 'Notes' },
            { to: '/student/coding', label: '💻 Coding' },
            { to: '/student/attendance', label: '📋 Attendance' },
            { to: '/student/analytics', label: 'Analytics' },
        ],
    };

    const links = user ? (navLinks[user.role] || []) : [];
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="navbar">
                <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
                    🧠 <span>Quiz Learner</span>
                </Link>

                {/* Desktop links */}
                <div className="navbar-desktop">
                    {user && links.map(l => (
                        <Link key={l.to} to={l.to}
                            className={`navbar-link ${isActive(l.to) ? 'active' : ''}`}>
                            {l.label}
                        </Link>
                    ))}
                </div>

                <div className="navbar-right">
                    <button onClick={toggleTheme} className="navbar-icon-btn">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {user ? (
                        <>
                            <span className="navbar-badge">{user.role}</span>
                            {user.avatar && (
                                <img src={user.avatar} alt="avatar"
                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                            )}
                            <button onClick={handleLogout} className="navbar-logout desktop-only">Logout</button>
                            <button onClick={() => setMenuOpen(v => !v)} className="navbar-hamburger mobile-only" aria-label="Menu">
                                <span className={`bar ${menuOpen ? 'bar1-open' : ''}`} />
                                <span className={`bar ${menuOpen ? 'bar2-open' : ''}`} />
                                <span className={`bar ${menuOpen ? 'bar3-open' : ''}`} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="navbar-login-btn">Login</Link>
                    )}
                </div>
            </motion.nav>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="drawer-backdrop" onClick={() => setMenuOpen(false)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.25 }} className="drawer">
                            <div className="drawer-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="avatar"
                                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                    ) : (
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="drawer-name">{user?.name}</div>
                                        <div className="drawer-email">{user?.email}</div>
                                    </div>
                                </div>
                                <span className="navbar-badge">{user?.role}</span>
                            </div>
                            <div className="drawer-links">
                                {links.map(l => (
                                    <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                                        className={`drawer-link ${isActive(l.to) ? 'active' : ''}`}>
                                        {l.label}
                                    </Link>
                                ))}
                            </div>
                            <button onClick={handleLogout} className="drawer-logout">🚪 Logout</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
