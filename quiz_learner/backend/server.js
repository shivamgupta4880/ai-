const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Manual CORS — works on Vercel serverless
app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use('/uploads', require('express').static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/coding', require('./routes/codingRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Quiz Learner API running' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

// Connect MongoDB
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected');
};

// Vercel serverless — wrap with DB connection
const handler = async (req, res) => {
    await connectDB();
    return app(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => {
        app.listen(process.env.PORT || 5000, () =>
            console.log(`Server running on port ${process.env.PORT || 5000}`)
        );
    });
}

module.exports = handler;
