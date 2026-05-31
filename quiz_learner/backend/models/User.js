const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        profileSetup: { type: Boolean, default: false },
        otp: { type: String },
        otpExpiry: { type: Date },
        studentClass: { type: String, default: '' },
        collegeCourse: { type: String, default: '' },
        section: { type: String, default: '' },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
