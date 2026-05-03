const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Validation rules for registration
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['teacher', 'student']).withMessage('Role must be either teacher or student'),
  body('studentId').if(body('role').equals('student')).notEmpty().withMessage('Student ID is required for students'),
  // For teachers: validate subjects array
  body('subjects').if(body('role').equals('teacher')).isArray().withMessage('Subjects must be an array'),
  body('subjects.*.subjectId').if(body('role').equals('teacher')).notEmpty().withMessage('Subject ID is required'),
  body('subjects.*.subjectName').if(body('role').equals('teacher')).notEmpty().withMessage('Subject name is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);

// NEW: Route to add subjects for existing teacher
router.post('/add-subjects', authMiddleware, [
  body('subjects').isArray().withMessage('Subjects must be an array'),
  body('subjects.*.subjectId').notEmpty().withMessage('Subject ID is required'),
  body('subjects.*.subjectName').notEmpty().withMessage('Subject name is required')
], authController.addSubjects);

// NEW: Route to get teacher's subjects
router.get('/my-subjects', authMiddleware, authController.getMySubjects);

module.exports = router;