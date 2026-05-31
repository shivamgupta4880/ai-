const Timetable = require('../models/Timetable');

// GET /api/timetable — admin gets all, teacher gets own
const getTimetable = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { teacherId: req.user._id };
        const entries = await Timetable.find(filter)
            .populate('teacherId', 'name email')
            .sort({ day: 1, startTime: 1 });
        res.json(entries);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/timetable — admin creates entry
const createEntry = async (req, res) => {
    try {
        const entry = await Timetable.create(req.body);
        const populated = await Timetable.findById(entry._id).populate('teacherId', 'name email');
        res.status(201).json(populated);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/timetable/:id
const deleteEntry = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/timetable/teachers — get all teachers list for dropdown
const getTeachers = async (req, res) => {
    try {
        const User = require('../models/User');
        const teachers = await User.find({ role: 'teacher', isActive: true }).select('name email');
        res.json(teachers);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getTimetable, createEntry, deleteEntry, getTeachers };
