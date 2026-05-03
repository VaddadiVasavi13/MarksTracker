const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (userId, role, name) => {
  return jwt.sign(
    { userId, role, name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role, studentId, subjects } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check studentId uniqueness for students
    if (role === 'student') {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    // For teachers, check for duplicate subject IDs
    if (role === 'teacher' && subjects) {
      const subjectIds = subjects.map(s => s.subjectId);
      const hasDuplicates = new Set(subjectIds).size !== subjectIds.length;
      if (hasDuplicates) {
        return res.status(400).json({ message: 'Duplicate subject IDs are not allowed' });
      }
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      studentId: role === 'student' ? studentId : undefined,
      subjects: role === 'teacher' ? (subjects || []) : []
    };

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id, user.role, user.name);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        subjects: user.subjects || []
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.name);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        subjects: user.subjects || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add subjects for existing teacher
exports.addSubjects = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can add subjects' });
    }

    const { subjects } = req.body;
    
    // Validate subjects
    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject is required' });
    }

    // Check for duplicate subject IDs in the request
    const subjectIds = subjects.map(s => s.subjectId);
    const hasDuplicates = new Set(subjectIds).size !== subjectIds.length;
    if (hasDuplicates) {
      return res.status(400).json({ message: 'Duplicate subject IDs in request' });
    }

    // Find teacher
    const teacher = await User.findById(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check for existing subject IDs
    const existingSubjectIds = teacher.subjects.map(s => s.subjectId);
    const duplicateSubjects = subjects.filter(s => existingSubjectIds.includes(s.subjectId));
    
    if (duplicateSubjects.length > 0) {
      return res.status(400).json({ 
        message: 'Some subjects already exist', 
        duplicateSubjects: duplicateSubjects.map(s => s.subjectId)
      });
    }

    // Add new subjects
    const newSubjects = subjects.map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      addedAt: new Date()
    }));

    teacher.subjects.push(...newSubjects);
    await teacher.save();

    res.json({
      success: true,
      message: `${newSubjects.length} subject(s) added successfully`,
      subjects: teacher.subjects
    });
  } catch (error) {
    console.error('Add subjects error:', error);
    res.status(500).json({ message: 'Server error while adding subjects' });
  }
};

// Get teacher's subjects
exports.getMySubjects = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }

    const teacher = await User.findById(req.user.userId).select('subjects');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      success: true,
      subjects: teacher.subjects || []
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};