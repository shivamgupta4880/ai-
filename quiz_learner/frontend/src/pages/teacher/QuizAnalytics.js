import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getQuizAnalytics } from '../../utils/api';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const QuizAnalytics = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getQuizAnalytics(id).then(({ data }) => setData(data)).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <Loader />;

    const chartData = data?.attempts?.map((a, i) => ({
        name: a.studentId?.name || `Student ${i + 1}`,
        score: a.score,
    })) || [];

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Quiz Result Report', 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Total Attempts: ${data?.totalAttempts || 0}   |   Average Score: ${data?.avgScore || 0}%`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

        autoTable(doc, {
            startY: 45,
            head: [['#', 'Student', 'Email', 'Score', 'Correct', 'Performance', 'Time Taken', 'Date']],
            body: data?.attempts?.map((a, i) => [
                i + 1,
                a.studentId?.name || 'N/A',
                a.studentId?.email || 'N/A',
                `${a.score}%`,
                `${a.correctAnswers}/${a.totalQuestions}`,
                a.performanceLevel,
                a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : '-',
                new Date(a.createdAt).toLocaleDateString(),
            ]) || [],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
        });

        doc.save(`quiz-results-${Date.now()}.pdf`);
    };

    return (
        <div style={styles.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={styles.title}>Quiz Analytics</h1>
                <button onClick={downloadPDF} style={styles.pdfBtn}>📥 Download PDF Report</button>
            </div>
            <div style={styles.grid}>
                <StatCard icon="🏆" label="Total Attempts" value={data?.totalAttempts || 0} color="#6366f1" />
                <StatCard icon="📊" label="Average Score" value={`${data?.avgScore || 0}%`} color="#10b981" />
            </div>
            <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Student Scores</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                        <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <h2 style={styles.sectionTitle}>Attempt Details</h2>
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead><tr style={styles.thead}><th>Student</th><th>Score</th><th>Correct</th><th>Performance</th><th>Date</th></tr></thead>
                    <tbody>
                        {data?.attempts?.map((a) => (
                            <tr key={a._id} style={styles.row}>
                                <td style={styles.td}>{a.studentId?.name || 'N/A'}</td>
                                <td style={styles.td}>{a.score}%</td>
                                <td style={styles.td}>{a.correctAnswers}/{a.totalQuestions}</td>
                                <td style={styles.td}><span style={{ ...styles.badge, background: a.performanceLevel === 'excellent' ? '#10b98120' : a.performanceLevel === 'good' ? '#6366f120' : a.performanceLevel === 'average' ? '#f59e0b20' : '#ef444420', color: a.performanceLevel === 'excellent' ? '#10b981' : a.performanceLevel === 'good' ? '#6366f1' : a.performanceLevel === 'average' ? '#f59e0b' : '#ef4444' }}>{a.performanceLevel}</span></td>
                                <td style={styles.td}>{new Date(a.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    page: { padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)', maxWidth: 1100, margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 700, color: 'var(--text)' },
    pdfBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    chartCard: { background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '2rem' },
    chartTitle: { fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' },
    sectionTitle: { fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' },
    tableWrap: { overflowX: 'auto', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: 'var(--primary)', color: '#fff' },
    row: { borderBottom: '1px solid var(--border)' },
    td: { padding: '1rem 1.2rem', color: 'var(--text)', fontSize: '0.9rem' },
    badge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' },
};

export default QuizAnalytics;

