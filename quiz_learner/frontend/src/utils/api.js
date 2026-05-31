import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL: `${BASE_URL}/api` });

// Attach token from localStorage on every request
API.interceptors.request.use((config) => {
    const user = localStorage.getItem('quizUser');
    if (user) {
        const { token } = JSON.parse(user);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const sendOtp = (data) => API.post('/auth/send-otp', data);
export const loginWithOtp = (data) => API.post('/auth/login-otp', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Users (admin)
export const getAllUsers = () => API.get('/users');
export const createUserByAdmin = (data) => API.post('/users', data);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const getPlatformAnalytics = () => API.get('/users/analytics');
export const uploadAvatar = (formData) => API.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const completeProfileSetup = () => API.put('/users/profile-setup');

// Quizzes
export const getPublishedQuizzes = (params) => API.get('/quizzes', { params });
export const getTeacherQuizzes = () => API.get('/quizzes/teacher');
export const getAllQuizzes = () => API.get('/quizzes/all');
export const getQuizById = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (data) => API.post('/quizzes', data);
export const updateQuiz = (id, data) => API.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);
export const getQuizAnalytics = (id) => API.get(`/quizzes/${id}/analytics`);

// Attempts
export const submitAttempt = (data) => API.post('/attempts', data);
export const getMyAttempts = () => API.get('/attempts/my');
export const getMyAnalytics = () => API.get('/attempts/my/analytics');
export const getAttemptById = (id) => API.get(`/attempts/${id}`);

// AI
export const generateAIQuestions = (data) => API.post('/ai/generate-questions', data);
export const generateMixedQuiz = (data) => API.post('/ai/generate-mixed', data);
export const suggestSubject = (data) => API.post('/ai/suggest-subject', data);
export const analyzePerformance = (data) => API.post('/ai/analyze-performance', data);

// Notes
export const getMyNotes = () => API.get('/notes');
export const getTeacherNotes = () => API.get('/notes/teacher');
export const createNote = (data) => API.post('/notes', data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
export const aiGenerateNote = (data) => API.post('/notes/ai-generate', data);
export const setStudentClass = (data) => API.put('/notes/set-class', data);
export const uploadPDFNote = (formData) => API.post('/notes/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

// Attendance
export const markAttendance = (data) => API.post('/attendance/mark', data);
export const getMyAttendance = (quizId) => API.get(`/attendance/my/${quizId}`);
export const getMyAttendanceFull = () => API.get('/attendance/my');
export const getQuizAttendance = (quizId) => API.get(`/attendance/${quizId}`);
export const teacherMarkAttendance = (data) => API.post('/attendance/teacher-mark', data);
export const bulkMarkAttendance = (data) => API.post('/attendance/bulk', data);
export const getStudentsByClass = (params) => API.get('/attendance/students', { params });
export const getAttendanceReport = (params) => API.get('/attendance/report', { params });

// Coding Challenges
export const getChallenges = () => API.get('/coding');
export const getTeacherChallenges = () => API.get('/coding/teacher');
export const getChallengeById = (id) => API.get(`/coding/${id}`);
export const createChallenge = (data) => API.post('/coding', data);
export const updateChallenge = (id, data) => API.put(`/coding/${id}`, data);
export const deleteChallenge = (id) => API.delete(`/coding/${id}`);
export const runCode = (data) => API.post('/coding/run', data);
export const submitCode = (data) => API.post('/coding/submit', data);
export const getMyCodingAttempts = () => API.get('/coding/my-attempts');

// Timetable
export const getTimetable = () => API.get('/timetable');
export const getTeachersForTimetable = () => API.get('/timetable/teachers');
export const createTimetableEntry = (data) => API.post('/timetable', data);
export const deleteTimetableEntry = (id) => API.delete(`/timetable/${id}`);

// Results by section (admin/teacher)
export const getResultsBySection = (params) => API.get('/attempts/section', { params });
