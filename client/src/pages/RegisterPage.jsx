import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, Hash, Plus, Trash2, BookOpen } from 'lucide-react';
import './AuthPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    subjects: [{ subjectId: '', subjectName: '' }] // For teachers
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = value;
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { subjectId: '', subjectName: '' }]
    });
  };

  const removeSubject = (index) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare data based on role
    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      ...(formData.role === 'student' && { studentId: formData.studentId }),
      ...(formData.role === 'teacher' && { 
        subjects: formData.subjects.filter(s => s.subjectId && s.subjectName) 
      })
    };
    
    const result = await register(submitData);
    
    if (result.success) {
      const dashboardPath = result.user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
      navigate(dashboardPath);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <div className="auth-header">
          <BookOpen size={40} className="auth-icon" />
          <h2>Create Account</h2>
          <p>Join GradeFlow today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User size={20} />
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <Mail size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <Lock size={20} />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="input-group">
            <Briefcase size={20} />
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          
          {formData.role === 'student' && (
            <div className="input-group">
              <Hash size={20} />
              <input
                type="text"
                name="studentId"
                placeholder="Student ID (e.g., STU2024001)"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          {formData.role === 'teacher' && (
            <div className="subjects-section">
              <label className="subjects-label">
                <BookOpen size={18} />
                Subjects You Teach
              </label>
              {formData.subjects.map((subject, index) => (
                <div key={index} className="subject-input-group">
                  <input
                    type="text"
                    placeholder="Subject ID (e.g., MATH101)"
                    value={subject.subjectId}
                    onChange={(e) => handleSubjectChange(index, 'subjectId', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject Name (e.g., Mathematics)"
                    value={subject.subjectName}
                    onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                    required
                  />
                  {formData.subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(index)} className="remove-subject">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSubject} className="add-subject-btn">
                <Plus size={16} /> Add Another Subject
              </button>
              <small className="subjects-hint">
                You can add more subjects later from your dashboard
              </small>
            </div>
          )}
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;