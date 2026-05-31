import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getChallengeById, runCode, submitCode } from '../../utils/api';
import Loader from '../../components/Loader';

const LANG_STARTERS = {
    javascript: '// Write your solution here\n\n',
    python: '# Write your solution here\n\n',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
};

const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

const CodingEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [activeTab, setActiveTab] = useState('description'); // description | testcases | results
    const [fontSize, setFontSize] = useState(14);
    const editorRef = useRef(null);

    useEffect(() => {
        getChallengeById(id).then(({ data }) => {
            setChallenge(data);
            setLanguage(data.language || 'javascript');
            setCode(data.starterCode || LANG_STARTERS[data.language] || LANG_STARTERS.javascript);
        }).catch(() => toast.error('Challenge not found'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleRun = async () => {
        setRunning(true);
        setActiveTab('results');
        try {
            const { data } = await runCode({ challengeId: id, code, language });
            setResults(data.results);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Run failed');
        } finally { setRunning(false); }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setActiveTab('results');
        try {
            const { data } = await submitCode({ challengeId: id, code, language });
            setSubmitResult(data);
            if (data.status === 'passed') toast.success('All test cases passed!');
            else if (data.status === 'partial') toast(`${data.testsPassed}/${data.totalTests} passed`, { icon: '⚠️' });
            else toast.error('All test cases failed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    if (loading) return <Loader />;
    if (!challenge) return <p style={{ padding: '2rem', color: 'var(--text)' }}>Challenge not found</p>;

    return (
        <div style={s.page}>
            {/* Top Bar */}
            <div style={s.topBar}>
                <button onClick={() => navigate('/student/coding')} style={s.backBtn}>← Back</button>
                <span style={s.challengeTitle}>{challenge.title}</span>
                <span style={{ ...s.diffBadge, background: DIFF_COLOR[challenge.difficulty] + '20', color: DIFF_COLOR[challenge.difficulty] }}>
                    {challenge.difficulty}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Font:</label>
                    <select style={s.smallSelect} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}>
                        {[12, 13, 14, 15, 16, 18, 20].map(f => <option key={f} value={f}>{f}px</option>)}
                    </select>
                </div>
            </div>

            {/* Main Split Layout */}
            <div style={s.split}>
                {/* Left Panel */}
                <div style={s.leftPanel}>
                    {/* Tabs */}
                    <div style={s.tabs}>
                        {['description', 'testcases', 'results'].map(tab => (
                            <button key={tab} style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
                                onClick={() => setActiveTab(tab)}>
                                {tab === 'description' ? '📄 Problem' : tab === 'testcases' ? '🧪 Test Cases' : '📊 Results'}
                            </button>
                        ))}
                    </div>

                    <div style={s.leftContent}>
                        {/* Description */}
                        {activeTab === 'description' && (
                            <div>
                                <h2 style={s.problemTitle}>{challenge.title}</h2>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                                    <span style={{ ...s.diffBadge, background: DIFF_COLOR[challenge.difficulty] + '20', color: DIFF_COLOR[challenge.difficulty] }}>{challenge.difficulty}</span>
                                    <span style={s.langBadge}>{challenge.language}</span>
                                    {challenge.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}
                                </div>
                                <div style={s.description}>{challenge.description}</div>
                                {challenge.targetClass && (
                                    <div style={s.infoBox}>
                                        <span>🎓 {challenge.targetClass}</span>
                                        {challenge.section && <span> · Section {challenge.section}</span>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Cases */}
                        {activeTab === 'testcases' && (
                            <div>
                                <h3 style={s.sectionHead}>Sample Test Cases</h3>
                                {challenge.testCases?.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No visible test cases.</p>}
                                {challenge.testCases?.map((tc, i) => (
                                    <div key={i} style={s.tcCard}>
                                        <div style={s.tcLabel}>Case {i + 1}</div>
                                        {tc.input && <div style={s.tcRow}><span style={s.tcKey}>Input:</span><code style={s.tcCode}>{tc.input}</code></div>}
                                        <div style={s.tcRow}><span style={s.tcKey}>Expected:</span><code style={s.tcCode}>{tc.expectedOutput}</code></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Results */}
                        {activeTab === 'results' && (
                            <div>
                                {/* Submit Result */}
                                {submitResult && (
                                    <div style={{ ...s.resultBanner, background: submitResult.status === 'passed' ? '#10b98120' : submitResult.status === 'partial' ? '#f59e0b20' : '#ef444420', borderColor: submitResult.status === 'passed' ? '#10b981' : submitResult.status === 'partial' ? '#f59e0b' : '#ef4444' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{submitResult.status === 'passed' ? '✅' : submitResult.status === 'partial' ? '⚠️' : '❌'}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                                                {submitResult.status === 'passed' ? 'Accepted' : submitResult.status === 'partial' ? 'Partial' : 'Wrong Answer'}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {submitResult.testsPassed}/{submitResult.totalTests} test cases passed
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Run Results */}
                                {running && <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>⏳ Running...</div>}
                                {results && !running && (
                                    <div>
                                        <h3 style={s.sectionHead}>Run Results</h3>
                                        {results.map((r, i) => (
                                            <div key={i} style={{ ...s.tcCard, borderColor: r.passed ? '#10b981' : '#ef4444' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={s.tcLabel}>Case {i + 1}</span>
                                                    <span style={{ color: r.passed ? '#10b981' : '#ef4444', fontWeight: 700 }}>{r.passed ? '✅ Passed' : '❌ Failed'}</span>
                                                </div>
                                                {r.input && <div style={s.tcRow}><span style={s.tcKey}>Input:</span><code style={s.tcCode}>{r.input}</code></div>}
                                                <div style={s.tcRow}><span style={s.tcKey}>Expected:</span><code style={s.tcCode}>{r.expectedOutput}</code></div>
                                                <div style={s.tcRow}><span style={s.tcKey}>Got:</span><code style={{ ...s.tcCode, color: r.passed ? '#10b981' : '#ef4444' }}>{r.actualOutput || '(empty)'}</code></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!results && !running && !submitResult && (
                                    <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>Run or submit your code to see results.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel — Editor */}
                <div style={s.rightPanel}>
                    {/* Editor Header */}
                    <div style={s.editorHeader}>
                        <select style={s.langSelect} value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        <button style={s.resetBtn} onClick={() => setCode(challenge.starterCode || LANG_STARTERS[language])}>↺ Reset</button>
                    </div>

                    {/* Monaco Editor */}
                    <Editor
                        height="calc(100vh - 200px)"
                        language={language === 'cpp' ? 'cpp' : language}
                        value={code}
                        onChange={val => setCode(val || '')}
                        onMount={editor => { editorRef.current = editor; }}
                        theme="vs-dark"
                        options={{
                            fontSize,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            renderLineHighlight: 'all',
                            automaticLayout: true,
                            tabSize: 2,
                            padding: { top: 16 },
                        }}
                    />

                    {/* Bottom Action Bar */}
                    <div style={s.actionBar}>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleRun} disabled={running || submitting} style={s.runBtn}>
                            {running ? '⏳ Running...' : '▶ Run Code'}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={running || submitting} style={s.submitBtn}>
                            {submitting ? '⏳ Submitting...' : '🚀 Submit'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const s = {
    page: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' },
    topBar: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', background: 'var(--card)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
    backBtn: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' },
    challengeTitle: { fontWeight: 700, color: 'var(--text)', fontSize: '1rem' },
    diffBadge: { padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' },
    langBadge: { background: '#6366f120', color: 'var(--primary)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 },
    tagBadge: { background: 'var(--border)', color: 'var(--text-muted)', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem' },
    smallSelect: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.3rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem' },
    split: { display: 'flex', flex: 1, overflow: 'hidden' },
    leftPanel: { width: '40%', minWidth: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' },
    tabs: { display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--card)' },
    tab: { flex: 1, padding: '0.7rem', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', borderBottom: '2px solid transparent' },
    tabActive: { color: 'var(--primary)', borderBottom: '2px solid var(--primary)', background: 'var(--bg)' },
    leftContent: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
    problemTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.8rem' },
    description: { color: 'var(--text)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' },
    infoBox: { marginTop: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' },
    sectionHead: { fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' },
    tcCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.8rem' },
    tcLabel: { fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.5rem' },
    tcRow: { display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.3rem' },
    tcKey: { color: 'var(--text-muted)', fontSize: '0.82rem', minWidth: 70, fontWeight: 600 },
    tcCode: { background: 'var(--bg)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'monospace', wordBreak: 'break-all' },
    resultBanner: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', borderRadius: '12px', border: '1.5px solid', marginBottom: '1.2rem' },
    rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    editorHeader: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 1rem', background: '#1e1e1e', borderBottom: '1px solid #333' },
    langSelect: { background: '#2d2d2d', border: '1px solid #444', color: '#fff', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.85rem' },
    resetBtn: { background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' },
    actionBar: { display: 'flex', gap: '0.8rem', padding: '0.8rem 1rem', background: '#1e1e1e', borderTop: '1px solid #333', justifyContent: 'flex-end' },
    runBtn: { background: '#2d2d2d', color: '#fff', border: '1px solid #555', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    submitBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.8rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' },
};

export default CodingEditor;
