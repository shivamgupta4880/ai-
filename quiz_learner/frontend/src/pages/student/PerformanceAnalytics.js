import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { getMyAnalytics } from '../../utils/api';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';

const PerformanceAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyAnalytics().then(({ data }) => setData(data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

    const trendData = data?.attempts?.slice(-10).map((a, i) => ({
        attempt: `#${i + 1}`,
        score: a.score,
        quiz: a.quizId?.title?.substring(0, 15) || 'Quiz',
    })) || [];

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>My Performance Analytics</h1>
            <div style={styles.grid}>
                <StatCard icon="🏆" label="Total Attempts" value={data?.totalAttempts || 0} color="#6366f1" />
                <StatCard icon="📊" label="Average Score" value={`${data?.avgScore || 0}%`} color="#10b981" />
                <StatCard icon="📚" label="Categories Covered" value={data?.categoryStats?.length || 0} color="#f59e0b" />
            </div>

            <div style={styles.chartsRow}>
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Score Trend (Last 10 Attempts)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="attempt" stroke="var(--text-muted)" />
                            <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Performance by Category</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data?.categoryStats || []}>
                            <XAxis dataKey="category" stroke="var(--text-muted)" />
                            <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                            <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Insights */}
            <div style={styles.insightCard}>
                <h3 style={styles.insightTitle}>🤖 AI Learning Insights</h3>
                {data?.categoryStats?.length > 0 ? (
                    <>
                        <p style={styles.insightText}>
                            Your strongest category is <strong>{data.categoryStats.reduce((a, b) => +a.avgScore > +b.avgScore ? a : b).category}</strong>.
                        </p>
                        <p style={styles.insightText}>
                            Focus more on <strong>{data.categoryStats.reduce((a, b) => +a.avgScore < +b.avgScore ? a : b).category}</strong> to improve your overall performance.
                        </p>
                        <p style={styles.insightText}>Keep attempting quizzes regularly to maintain your learning streak!</p>
                    </>
                ) : (
                    <p style={styles.insightText}>Attempt some quizzes to get personalized AI insights!</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' },
    chartCard: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
    chartTitle: { fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' },
    insightCard: { background: 'linear-gradient(135deg, #6366f110, #06b6d410)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--primary)' },
    insightTitle: { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' },
    insightText: { color: 'var(--text)', lineHeight: 1.7, marginBottom: '0.5rem' },
};

export default PerformanceAnalytics;
