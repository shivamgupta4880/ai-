import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getPlatformAnalytics, getAllUsers } from '../../utils/api';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const PlatformAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getPlatformAnalytics(), getAllUsers()])
            .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

    const roleData = [
        { name: 'Students', value: stats?.totalStudents || 0 },
        { name: 'Teachers', value: stats?.totalTeachers || 0 },
    ];

    // Monthly signups (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const month = d.toLocaleString('default', { month: 'short' });
        const count = users.filter((u) => {
            const ud = new Date(u.createdAt);
            return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
        }).length;
        return { month, count };
    });

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>Platform Analytics</h1>
            <div style={styles.grid}>
                <StatCard icon="👥" label="Total Users" value={stats?.totalUsers || 0} color="#6366f1" />
                <StatCard icon="📝" label="Total Quizzes" value={stats?.totalQuizzes || 0} color="#06b6d4" />
                <StatCard icon="🏆" label="Total Attempts" value={stats?.totalAttempts || 0} color="#10b981" />
            </div>

            <div style={styles.chartsRow}>
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Monthly Signups</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="month" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>User Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                                {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Legend />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' },
    chartCard: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    chartTitle: { fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' },
};

export default PlatformAnalytics;
