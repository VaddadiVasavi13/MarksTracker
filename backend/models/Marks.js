const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required']
  },
  subjectId: {
    type: String,
    required: [true, 'Subject ID is required'],
    trim: true
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks cannot be less than 0'],
    max: [100, 'Marks cannot be more than 100']
  },
  examType: {
    type: String,
    enum: ['Mid Term', 'Final Exam', 'Quiz', 'Assignment', 'Unit Test'],
    default: 'Unit Test'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// REMOVED the unique compound index
// Now teachers can add multiple quizzes, assignments, etc. for the same subject

// Only keep regular indexes for faster queries
marksSchema.index({ studentId: 1 });
marksSchema.index({ subjectId: 1 });
marksSchema.index({ teacherId: 1 });
marksSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Marks', marksSchema);