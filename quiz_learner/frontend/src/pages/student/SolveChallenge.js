import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getChallengeById, runCode, submitCode } from '../../utils/api';
import Loader from '../../components/Loader';

const STARTER = {
    javascript: `// Write your solution here\n// Use console.log() to output results\n\nfunction solution(input) {\n    // your code\n    console.log(input);\n}\n\nsolution(input);`,
    python: `# Python execution not supported yet\n# Use JavaScript`,
};

const SolveChallenge = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [activeTab, setActiveTab] = useState('description'); // description | testcases | results

    useEffect(() => {
        getChallengeById(id).then(({ data }) => {
            setChallenge(data);
            setCode(data.starterCode || STARTER[data.language] || STARTER.javascript);
        }).catch(() => toast.error('Failed to load challenge'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleRun = async () => {
        setRunning(true);
        setResults(null);
        setActiveTab('results');
        try {
            const { data } = await runCode({ challengeId: id, code, language: challenge.language });
            setResults(data.results);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Run failed');
        } finally { setRunning(false); }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitResult(null);
        setActiveTab('results');
        try {
            const { data } = await submitCode({ challengeId: id, code, language: