const Marks = require('../models/Marks');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all students (for teacher)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email studentId createdAt');
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add marks (updated - removed duplicate check)
exports.addMarks = async (req, res) => {
  try {
    const { studentId, subjectId, subjectName, marks, examType, remarks } = req.body;

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher teaches this subject
    const teacher = await User.findById(req.user.userId);
    const teachesSubject = teacher.subjects.some(s => s.subjectId === subjectId);
    
    if (!teachesSubject) {
      return res.status(403).json({ 
        message: `You don't teach subject with ID: ${subjectId}. Please add this subject to your profile first.` 
      });
    }

    // REMOVED the duplicate check for exam type
    // Now teachers can add multiple quizzes/assignments

    // Create marks entry
    const marksEntry = await Marks.create({
      studentId,
      studentName: student.name,
      subjectId,
      subjectName,
      marks,
      examType: examType || 'Unit Test',
      teacherId: req.user.userId,
      teacherName: req.user.name,
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Marks added successfully',
      marks: marksEntry
    });
  } catch (error) {
    console.error('Add marks error:', error);
    // Remove the duplicate key error handling
    res.status(500).json({ message: 'Server error while adding marks' });
  }
};

// Get marks
exports.getMarks = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.studentId = req.user.userId;
    } else if (req.user.role === 'teacher' && req.query.studentId) {
      query.studentId = req.query.studentId;
    }

    const marks = await Marks.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'name email studentId')
      .populate('teacherId', 'name email');

    res.json({ success: true, marks });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get average marks
exports.getAverageMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      targetStudentId = req.user.userId;
    }

    const averages = await Marks.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(targetStudentId) } },
      { 
        $group: {
          _id: '$subject',
          averageMarks: { $avg: '$marks' },
          highestMarks: { $max: '$marks' },
          lowestMarks: { $min: '$marks' },
          totalExams: { $sum: 1 }
        }
      },
      {
        $project: {
          subject: '$_id',
          averageMarks: { $round: ['$averageMarks', 2] },
          highestMarks: 1,
          lowestMarks: 1,
          totalExams: 1,
          _id: 0
        }
      }
    ]);

    const overallResult = await Marks.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(targetStudentId) } },
      {
        $group: {
          _id: null,
          overallAverage: { $avg: '$marks' }
        }
      }
    ]);

    const overallAverage = overallResult[0]?.overallAverage || 0;

    res.json({
      success: true,
      subjectAverages: averages,
      overallAverage: Math.round(overallAverage * 100) / 100
    });
  } catch (error) {
    console.error('Get averages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update marks
exports.updateMarks = async (req, res) => {
  try {
    const { marksId } = req.params;
    const { marks, remarks } = req.body;

    const marksEntry = await Marks.findById(marksId);
    if (!marksEntry) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }

    if (marks) marksEntry.marks = marks;
    if (remarks) marksEntry.remarks = remarks;

    await marksEntry.save();

    res.json({
      success: true,
      message: 'Marks updated successfully',
      marks: marksEntry
    });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete marks
exports.deleteMarks = async (req, res) => {
  try {
    const { marksId } = req.params;
    
    const marksEntry = await Marks.findByIdAndDelete(marksId);
    if (!marksEntry) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }

    res.json({
      success: true,
      message: 'Marks deleted successfully'
    });
  } catch (error) {
    console.error('Delete marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};