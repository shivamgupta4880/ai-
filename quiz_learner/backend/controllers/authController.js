const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOTPEmail = async (email, otp, subject) => {
    await transporter.sendMail({
        from: `"Quiz Learner" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:2rem;border-radius:12px;border:1px solid #e5e7eb">
            <h2 style="color:#6366f1">Quiz Learner</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing:8px;color:#6366f1">${otp}</h1>
            <p style="color:#6b7280;font-size:0.85rem">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>`,
    });
};

// @POST /api/auth/register — Admin only
const register = async (req, res) => {
    try {
        return res.status(403).json({ message: 'Account creation is restricted. Please contact the admin.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ message: 'Invalid email or password' });

        res.json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, token: generateToken(user._id),
            avatar: user.avatar || '', profileSetup: user.profileSetup || false,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @GET /api/auth/me
const getMe = async (req, res) => res.json(req.user);

// @POST /api/auth/send-otp  — send OTP for login or password reset
const sendOtp = async (req, res) => {
    try {
        const { email, purpose } = req.body; // purpose: 'login' | 'reset'
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        const subject = purpose === 'reset' ? 'Password Reset OTP - Quiz Learner' : 'Login OTP - Quiz Learner';
        await sendOTPEmail(email, otp, subject);

        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @POST /api/auth/login-otp  — login with OTP
const loginWithOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });
        if (!user.otp || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpiry < new Date())
            return res.status(400).json({ message: 'OTP has expired' });

        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, token: generateToken(user._id),
            avatar: user.avatar || '', profileSetup: user.profileSetup || false,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @POST /api/auth/reset-password  — verify OTP and set new password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });
        if (!user.otp || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpiry < new Date())
            return res.status(400).json({ message: 'OTP has expired' });
        if (!newPassword || newPassword.length < 6)
            return res.status(400).json({ message: 'Password must be at least 6 characters' });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { register, login, getMe, sendOtp, loginWithOtp, resetPassword };
