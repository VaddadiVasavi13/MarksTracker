const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const marksController = require('../controllers/marksController');
const authMiddleware = require('../middleware/auth');

// Middleware to check teacher role
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied. Teachers only.' });
  }
  next();
};

// Validation rules
const marksValidation = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('subject').isIn(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science']),
  body('marks').isInt({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100'),
  body('examType').optional().isIn(['Mid Term', 'Final Exam', 'Quiz', 'Assignment', 'Unit Test'])
];

// Routes
router.get('/students', authMiddleware, marksController.getAllStudents);
router.post('/add', authMiddleware, requireTeacher, marksValidation, marksController.addMarks);
router.get('/', authMiddleware, marksController.getMarks);
router.get('/average/:studentId', authMiddleware, marksController.getAverageMarks);
router.put('/update/:marksId', authMiddleware, requireTeacher, marksController.updateMarks);
router.delete('/delete/:marksId', authMiddleware, requireTeacher, marksController.deleteMarks);

module.exports = router;