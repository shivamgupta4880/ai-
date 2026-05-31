import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MODEL_URL = '/models';

const FaceVerification = ({ onVerified, onCancel }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading | ready | scanning | verified | failed | no-face
    const [message, setMessage] = useState('Loading face detection models...');
    const [progress, setProgress] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 5;

    // Load models
    useEffect(() => {
        const loadModels = async () => {
            try {
                setMessage('Loading AI models...');
                // Dynamic import to avoid build issues
                const faceapi = await import('face-api.js');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setMessage('Models loaded. Starting camera...');
                await startCamera();
            } catch (err) {
                setStatus('failed');
                setMessage('Failed to load models: ' + err.message);
            }
        };
        loadModels();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setStatus('ready');
                    setMessage('Camera ready. Click "Verify Face" to proceed.');
                };
            }
        } catch (err) {
            setStatus('failed');
            setMessage('Camera access denied. Please allow camera permission.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
    };

    const startVerification = async () => {
        setStatus('scanning');
        setMessage('Scanning your face...');
        setProgress(0);

        const faceapi = await import('face-api.js');
        let detected = false;
        let scanCount = 0;
        const totalScans = 10;

        const interval = setInterval(async () => {
            if (!videoRef.current) return;
            scanCount++;
            setProgress(Math.round((scanCount / totalScans) * 100));

            try {
                const detection = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks();

                if (detection) {
                    const { score } = detection.detection;
                    if (score > 0.6) {
                        detected = true;
                    }
                }
            } catch (e) { }

            if (scanCount >= totalScans) {
                clearInterval(interval);
                if (detected) {
                    setStatus('verified');
                    setMessage('✅ Face verified successfully!');
                    setProgress(100);
                    stopCamera();
                    setTimeout(() => onVerified(), 1200);
                } else {
                    const newAttempts = attempts + 1;
                    setAttempts(newAttempts);
                    if (newAttempts >= MAX_ATTEMPTS) {
                        setStatus('failed');
                        setMessage('❌ Too many failed attempts. Access denied.');
                        stopCamera();
                    } else {
                        setStatus('no-face');
                        setMessage(`No face detected. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
                    }
                }
            }
        }, 200);
    };

    const retry = () => {
        setStatus('ready');
        setMessage('Camera ready. Click "Verify Face" to try again.');
        setProgress(0);
    };

    return (
        <div style={s.overlay}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={s.modal}>
                <div style={s.header}>
                    <span style={{ fontSize: '1.8rem' }}>🔐</span>
                    <div>
                        <h2 style={s.title}>Face Verification</h2>
                        <p style={s.sub}>Admin access requires face verification</p>
                    </div>
                </div>

                {/* Video */}
                <div style={s.videoWrap}>
                    <video ref={videoRef} style={s.video} muted playsInline />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Scanning overlay */}
                    {status === 'scanning' && (
                        <div style={s.scanOverlay}>
                            <div style={s.scanLine} />
                        </div>
                    )}

                    {/* Status icon overlay */}
                    {status === 'verified' && (
                        <div style={s.resultOverlay}>
                            <span style={{ fontSize: '4rem' }}>✅</span>
                        </div>
                    )}
                    {status === 'failed' && (
                        <div style={{ ...s.resultOverlay, background: 'rgba(239,68,68,0.7)' }}>
                            <span style={{ fontSize: '4rem' }}>❌</span>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {status === 'scanning' && (
                    <div style={s.progressWrap}>
                        <div style={{ ...s.progressBar, width: `${progress}%` }} />
                    </div>
                )}

                {/* Message */}
                <p style={{
                    ...s.message,
                    color: status === 'verified' ? '#10b981' : status === 'failed' || status === 'no-face' ? '#ef4444' : 'var(--text-muted)'
                }}>
                    {message}
                </p>

                {/* Attempt counter */}
                {attempts > 0 && status !== 'verified' && status !== 'failed' && (
                    <div style={s.attemptBadge}>
                        Attempts: {attempts}/{MAX_ATTEMPTS}
                    </div>
                )}

                {/* Buttons */}
                <div style={s.btns}>
                    {status === 'ready' && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={startVerification} style={s.verifyBtn}>
                            🔍 Verify Face
                        </motion.button>
                    )}
                    {status === 'no-face' && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={retry} style={s.verifyBtn}>
                            🔄 Try Again
                        </motion.button>
                    )}
                    {status !== 'verified' && (
                        <button onClick={() => { stopCamera(); onCancel(); }} style={s.cancelBtn}>
                            Cancel
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: 'var(--card)', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 480, border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    title: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
    sub: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 },
    videoWrap: { position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1rem', aspectRatio: '4/3' },
    video: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' },
    scanOverlay: { position: 'absolute', inset: 0, border: '3px solid #6366f1', borderRadius: '16px', overflow: 'hidden' },
    scanLine: { position: 'absolute', left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #6366f1, transparent)', animation: 'scanMove 1.5s linear infinite' },
    resultOverlay: { position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' },
    progressWrap: { height: 6, background: 'var(--border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '0.8rem' },
    progressBar: { height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '20px', transition: 'width 0.2s' },
    message: { textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 },
    attemptBadge: { textAlign: 'center', background: '#f59e0b20', color: '#f59e0b', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem' },
    btns: { display: 'flex', gap: '0.8rem', justifyContent: 'center' },
    verifyBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
    cancelBtn: { background: 'var(--bg)', color: 'var(--text-muted)', border: '1.5px solid var(--border)', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 500, cursor: 'pointer' },
};

// Inject scan animation
const style = document.createElement('style');
style.textContent = `@keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }`;
if (!document.getElementById('face-scan-style')) {
    style.id = 'face-scan-style';
    document.head.appendChild(style);
}

export default FaceVerification;
