const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, default: '' },
        subject: { type: String, required: true },
        targetClass: { type: String, required: true },
        section: { type: String, default: '' },
        course: { type: String, default: '' },
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tags: [{ type: String }],
        isPublished: { type: Boolean, default: true },
        pdfUrl: { type: String, default: '' },
        pdfName: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
