const Note = require('../models/Note');
const User = require('../models/User');
const { ask } = require('../utils/groqClient');

// GET /api/notes  — student gets notes for their class
const getNotesForStudent = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        if (!student.studentClass)
            return res.status(400).json({ message: 'Pehle apni class set karo' });

        const notes = await Note.find({
            targetClass: student.studentClass,
            isPublished: true,
        })
            .populate('teacherId', 'name')
            .sort({ createdAt: -1 });

        res.json({ notes, studentClass: student.studentClass });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/notes/teacher  — teacher sees their own notes
const getTeacherNotes = async (req, res) => {
    try {
        const notes = await Note.find({ teacherId: req.user._id })
            .populate('teacherId', 'name email')
            .sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/notes  — teacher creates note
const createNote = async (req, res) => {
    try {
        const note = await Note.create({ ...req.body, teacherId: req.user._id });
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/notes/:id
const deleteNote = async (req, res) => {
    try {
        await Note.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/notes/set-class  — student sets their class
const setStudentClass = async (req, res) => {
    try {
        const { studentClass, collegeCourse } = req.body;
        const updateData = { studentClass };
        if (collegeCourse !== undefined) updateData.collegeCourse = collegeCourse;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/notes/ai-generate  — AI generates note content using GROQ
const aiGenerateNote = async (req, res) => {
    try {
        const { subject, topic, targetClass } = req.body;
        if (!subject || !topic || !targetClass)
            return res.status(400).json({ message: 'Subject, topic and class are required' });

        const prompt = `Create concise study notes for ${targetClass} students on the topic: "${topic}" (Subject: ${subject}).

Format your response exactly like this:
## ${topic}

### Key Concepts
- Point 1
- Point 2
- Point 3

### Important Formulas / Facts
- Formula or fact 1
- Formula or fact 2

### Summary
2-3 lines summary.

Keep it simple, clear, and appropriate for ${targetClass} level. Max 300 words.`;

        const content = await ask(prompt, 'You are an expert teacher. Create clear, structured study notes in markdown format.');
        res.json({ content });
    } catch (err) {
        console.error('[aiGenerateNote]', err.message);
        res.status(500).json({ message: err.message });
    }
};

// POST /api/notes/upload-pdf — teacher uploads PDF note
const uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });
        const { title, subject, targetClass, tags } = req.body;
        if (!title || !subject || !targetClass)
            return res.status(400).json({ message: 'Title, subject and class are required' });

        const pdfUrl = `/uploads/${req.file.filename}`;
        const note = await Note.create({
            title,
            subject,
            targetClass,
            section: req.body.section || '',
            course: req.body.course || '',
            teacherId: req.user._id,
            content: '',
            pdfUrl,
            pdfName: req.file.originalname,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getNotesForStudent, getTeacherNotes, createNote, deleteNote, setStudentClass, aiGenerateNote, uploadPDF };
