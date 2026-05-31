import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { uploadAvatar, completeProfileSetup } from '../utils/api';

const ProfileSetup = ({ user, onComplete }) => {
    const [mode, setMode] = useState('choose'); // choose | camera | preview
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            streamRef.current = stream;
            setMode('camera');
            // Wait for video element to mount
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
            }, 100);
        } catch {
            toast.error('Camera access denied. Please allow camera permission.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        canvas.toBlob((blob) => {
            if (!blob) return toast.error('Failed to capture photo');
            const f = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            setFile(f);
            setPreview(url);
            stopCamera();
            setMode('preview');
        }, 'image/jpeg', 0.9);
    };

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (!f.type.startsWith('image/')) return toast.error('Please select an image file');
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setMode('preview');
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const { data } = await uploadAvatar(formData);
            toast.success('Profile picture set!');
            onComplete(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally { setUploading(false); }
    };

    const handleSkip = async () => {
        try {
            await completeProfileSetup();
        } catch { }
        onComplete(null);
    };

    return (
        <div style={s.overlay}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={s.modal}>
                {/* Header */}
                <div style={s.header}>
                    <div style={s.avatar}>
                        {preview ? (
                            <img src={preview} alt="preview" style={s.avatarImg} />
                        ) : (
                            <span style={{ fontSize: '2.5rem' }}>👤</span>
                        )}
                    </div>
                    <div>
                        <h2 style={s.title}>Welcome, {user?.name}! 👋</h2>
                        <p style={s.sub}>Set up your profile picture to get started</p>
                    </div>
                </div>

                {/* Camera view */}
                {mode === 'camera' && (
                    <div style={s.cameraWrap}>
                        <video ref={videoRef} autoPlay playsInline muted style={s.video} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <div style={s.cameraBtns}>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={capturePhoto} style={s.captureBtn}>
                                📸 Capture
                            </motion.button>
                            <button onClick={() => { stopCamera(); setMode('choose'); }} style={s.cancelCamBtn}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {mode === 'preview' && preview && (
                    <div style={s.previewWrap}>
                        <img src={preview} alt="preview" style={s.previewImg} />
                        <div style={s.previewBtns}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpload} style={s.uploadBtn} disabled={uploading}>
                                {uploading ? '⏳ Uploading...' : '✅ Use This Photo'}
                            </motion.button>
                            <button onClick={() => { setPreview(null); setFile(null); setMode('choose'); }} style={s.retakeBtn}>
                                🔄 Retake
                            </button>
                        </div>
                    </div>
                )}

                {/* Choose mode */}
                {mode === 'choose' && (
                    <div style={s.options}>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={startCamera} style={s.optionBtn}>
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            <span style={s.optionLabel}>Take Photo</span>
                            <span style={s.optionSub}>Use your camera</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} style={s.optionBtn}>
                            <span style={{ fontSize: '2rem' }}>🖼️</span>
                            <span style={s.optionLabel}>Upload Photo</span>
                            <span style={s.optionSub}>From gallery</span>
                        </motion.button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                    </div>
                )}

                {/* Skip */}
                {mode !== 'camera' && (
                    <button onClick={handleSkip} style={s.skipBtn}>
                        Skip for now →
                    </button>
                )}
            </motion.div>
        </div>
    );
};

const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: 'var(--card)', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 460, border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    avatar: { width: 64, height: 64, borderRadius: '50%', background: 'var(--bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    title: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
    sub: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 },
    options: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
    optionBtn: { background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: '16px', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.15s' },
    optionLabel: { fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' },
    optionSub: { color: 'var(--text-muted)', fontSize: '0.78rem' },
    cameraWrap: { borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1rem' },
    video: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' },
    cameraBtns: { display: 'flex', gap: '0.8rem', padding: '0.8rem', background: '#111', justifyContent: 'center' },
    captureBtn: { background: '#fff', color: '#000', border: 'none', padding: '0.7rem 2rem', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
    cancelCamBtn: { background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '0.7rem 1.5rem', borderRadius: '30px', cursor: 'pointer' },
    previewWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
    previewImg: { width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' },
    previewBtns: { display: 'flex', gap: '0.8rem' },
    uploadBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' },
    retakeBtn: { background: 'var(--bg)', color: 'var(--text)', border: '1.5px solid var(--border)', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 500, cursor: 'pointer' },
    skipBtn: { display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem', padding: '0.5rem', marginTop: '0.5rem' },
};

export default ProfileSetup;
