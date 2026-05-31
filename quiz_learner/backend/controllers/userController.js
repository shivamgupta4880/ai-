const User = require('../models/User');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');

// GET /api/users  (admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/users/:id  (admin)
const deleteUser = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'User not found' });
        if (target.email === 'nitishkumarpandey05@gmail.com')
            return res.status(403).json({ message: 'This admin account cannot be deleted' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/users/:id  (admin)
const updateUser = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'User not found' });
        // Prevent deactivating or changing role of super admin
        if (target.email === 'nitishkumarpandey05@gmail.com') {
            delete req.body.role;
            delete req.body.isActive;
        }
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/users/analytics  (admin)
const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalQuizzes = await Quiz.countDocuments();
        const totalAttempts = await Attempt.countDocuments();
        res.json({ totalUsers, totalStudents, totalTeachers, totalQuizzes, totalAttempts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/users  (admin creates student/teacher)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role)
            return res.status(400).json({ message: 'All fields are required' });
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });
        const user = await User.create({ name, email, password, role });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/users/avatar — upload profile picture
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const avatarUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatarUrl, profileSetup: true },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/users/profile-setup — mark profile as setup done
const completeProfileSetup = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileSetup: true },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllUsers, deleteUser, updateUser, getPlatformAnalytics, createUser, uploadAvatar, completeProfileSetup };
