import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, BookOpen, TrendingUp, X, Save, PlusCircle, Settings } from 'lucide-react';
import AddSubjectsModal from '../components/AddSubjectsModal';
import './Dashboard.css';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    subjectName: '',
    marks: '',
    examType: 'Unit Test',
    remarks: ''
  });

  const examTypes = ['Mid Term', 'Final Exam', 'Quiz', 'Assignment', 'Unit Test'];

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const response = await axios.get('/marks/students');
      setStudents(response.data.students);
    } catch (error) {
      toast.error('Failed to fetch students');
      console.error('Fetch students error:', error);
    }
  };

  // Fetch teacher's subjects
  const fetchTeacherSubjects = async () => {
    try {
      const response = await axios.get('/auth/my-subjects');
      setTeacherSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch your subjects');
    }
  };

  // Fetch marks for selected student
  const fetchMarks = async (studentId) => {
    try {
      const response = await axios.get(`/marks?studentId=${studentId}`);
      setMarks(response.data.marks);
    } catch (error) {
      toast.error('Failed to fetch marks');
      console.error('Fetch marks error:', error);
    }
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchMarks(student._id);
  };

  // Handle add marks form change
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle subject selection in add form
  const handleSubjectSelect = (subjectId) => {
    const selectedSubject = teacherSubjects.find(s => s.subjectId === subjectId);
    setFormData(prev => ({
      ...prev,
      subjectId: selectedSubject?.subjectId,
      subjectName: selectedSubject?.subjectName
    }));
  };

  // Add marks submission
  const handleAddMarks = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!formData.marks || formData.marks < 0 || formData.marks > 100) {
      toast.error('Please enter valid marks between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/marks/add', formData);
      toast.success('Marks added successfully');
      setShowAddModal(false);
      setFormData({
        studentId: '',
        subjectId: '',
        subjectName: '',
        marks: '',
        examType: 'Unit Test',
        remarks: ''
      });
      if (selectedStudent) fetchMarks(selectedStudent._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add marks');
      console.error('Add marks error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update marks submission
  const handleUpdateMarks = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/marks/update/${selectedMarks._id}`, {
        marks: formData.marks,
        remarks: formData.remarks
      });
      toast.success('Marks updated successfully');
      setShowEditModal(false);
      setSelectedMarks(null);
      if (selectedStudent) fetchMarks(selectedStudent._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update marks');
      console.error('Update marks error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete marks
  const handleDeleteMarks = async (marksId) => {
    if (window.confirm('Are you sure you want to delete these marks?')) {
      try {
        await axios.delete(`/marks/delete/${marksId}`);
        toast.success('Marks deleted successfully');
        if (selectedStudent) fetchMarks(selectedStudent._id);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete marks');
        console.error('Delete marks error:', error);
      }
    }
  };

  // Open edit modal
  const openEditModal = (marks) => {
    setSelectedMarks(marks);
    setFormData({
      marks: marks.marks,
      remarks: marks.remarks || '',
      subjectId: marks.subjectId,
      subjectName: marks.subjectName
    });
    setShowEditModal(true);
  };

  // Reset add form when modal opens
  const openAddModal = () => {
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }
    setFormData({
      studentId: selectedStudent._id,
      subjectId: '',
      subjectName: '',
      marks: '',
      examType: 'Unit Test',
      remarks: ''
    });
    setShowAddModal(true);
  };

  // Get score color class
  const getScoreClass = (marks) => {
    if (marks >= 75) return 'score-excellent';
    if (marks >= 60) return 'score-good';
    if (marks >= 45) return 'score-average';
    if (marks >= 35) return 'score-pass';
    return 'score-fail';
  };

  // Calculate statistics for selected student
  const calculateStats = () => {
    if (!marks.length) return null;
    
    const totalMarks = marks.reduce((sum, m) => sum + m.marks, 0);
    const average = (totalMarks / marks.length).toFixed(2);
    const highest = Math.max(...marks.map(m => m.marks));
    const lowest = Math.min(...marks.map(m => m.marks));
    const subjectsCount = new Set(marks.map(m => m.subjectId)).size;
    
    return { totalMarks, average, highest, lowest, subjectsCount, totalExams: marks.length };
  };

  useEffect(() => {
    fetchStudents();
    fetchTeacherSubjects();
  }, []);

  const stats = selectedStudent ? calculateStats() : null;

  return (
    <div className="dashboard teacher-dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <p>Manage student marks, track performance, and manage your subjects</p>
      </div>

      <div className="dashboard-content">
        {/* Sidebar - Students List */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3><Users size={20} /> Students</h3>
            <span className="student-count">{students.length} total</span>
          </div>
          <div className="students-list">
            {students.length === 0 ? (
              <div className="no-students">
                <p>No students registered yet</p>
              </div>
            ) : (
              students.map(student => (
                <div
                  key={student._id}
                  className={`student-item ${selectedStudent?._id === student._id ? 'active' : ''}`}
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="student-info">
                    <strong>{student.name}</strong>
                    <small>{student.studentId}</small>
                    <small className="student-email">{student.email}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {selectedStudent ? (
            <>
              {/* Teacher's Subjects Section */}
              <div className="subjects-section">
                <div className="subjects-header">
                  <h3><BookOpen size={18} /> Your Subjects</h3>
                  <button className="btn-add-subject" onClick={() => setShowSubjectsModal(true)}>
                    <PlusCircle size={16} /> Add Subjects
                  </button>
                </div>
                <div className="subjects-list">
                  {teacherSubjects.length === 0 ? (
                    <p className="no-subjects">No subjects added yet. Click "Add Subjects" to start.</p>
                  ) : (
                    teacherSubjects.map(subject => (
                      <span key={subject.subjectId} className="subject-tag">
                        {subject.subjectName} <small>({subject.subjectId})</small>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Student Marks Header */}
              <div className="marks-header">
                <div>
                  <h2>{selectedStudent.name}'s Academic Record</h2>
                  <p className="student-info-text">
                    Student ID: {selectedStudent.studentId} | Email: {selectedStudent.email}
                  </p>
                </div>
                <button 
                  className="btn-add" 
                  onClick={openAddModal}
                  disabled={teacherSubjects.length === 0}
                  title={teacherSubjects.length === 0 ? "Please add subjects first" : ""}
                >
                  <Plus size={18} /> Add Marks
                </button>
              </div>

              {/* Statistics Cards */}
              {stats && (
                <div className="stats-cards">
                  <div className="stat-card-mini">
                    <TrendingUp size={20} />
                    <div>
                      <label>Average Score</label>
                      <span className={getScoreClass(parseFloat(stats.average))}>
                        {stats.average}%
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini">
                    <div>
                      <label>Highest Score</label>
                      <span className="score-excellent">{stats.highest}%</span>
                    </div>
                  </div>
                  <div className="stat-card-mini">
                    <div>
                      <label>Lowest Score</label>
                      <span className="score-fail">{stats.lowest}%</span>
                    </div>
                  </div>
                  <div className="stat-card-mini">
                    <div>
                      <label>Total Exams</label>
                      <span>{stats.totalExams}</span>
                    </div>
                  </div>
                  <div className="stat-card-mini">
                    <div>
                      <label>Subjects</label>
                      <span>{stats.subjectsCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Marks Table */}
              <div className="marks-table-container">
                {marks.length === 0 ? (
                  <div className="no-marks">
                    <BookOpen size={48} />
                    <h3>No marks added yet</h3>
                    <p>Click the "Add Marks" button to add marks for this student</p>
                  </div>
                ) : (
                  <table className="marks-table">
                    <thead>
                      <tr>
                        <th>Subject ID</th>
                        <th>Subject Name</th>
                        <th>Exam Type</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Remarks</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map(mark => {
                        const grade = mark.marks >= 90 ? 'A+' : 
                                     mark.marks >= 80 ? 'A' :
                                     mark.marks >= 70 ? 'B+' :
                                     mark.marks >= 60 ? 'B' :
                                     mark.marks >= 50 ? 'C' :
                                     mark.marks >= 40 ? 'D' : 'F';
                        return (
                          <tr key={mark._id}>
                            <td><code>{mark.subjectId}</code></td>
                            <td>{mark.subjectName}</td>
                            <td>{mark.examType}</td>
                            <td className={getScoreClass(mark.marks)}>
                              <strong>{mark.marks}/100</strong>
                            </td>
                            <td className="grade-cell">{grade}</td>
                            <td>{mark.remarks || '-'}</td>
                            <td>{new Date(mark.date).toLocaleDateString()}</td>
                            <td className="actions">
                              <button onClick={() => openEditModal(mark)} className="btn-edit" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteMarks(mark._id)} className="btn-delete" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="select-prompt">
              <Users size={64} />
              <h3>Select a Student</h3>
              <p>Choose a student from the left sidebar to view and manage their marks</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Marks Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Marks for {selectedStudent?.name}</h3>
              <button onClick={() => setShowAddModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMarks}>
              <div className="form-group">
                <label>Subject *</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleSubjectSelect(e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {teacherSubjects.map(subject => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName} ({subject.subjectId})
                    </option>
                  ))}
                </select>
                {teacherSubjects.length === 0 && (
                  <small className="form-hint">
                    No subjects found. Please add subjects first using "Add Subjects" button.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Exam Type</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleAddFormChange}
                >
                  {examTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Marks (0-100) *</label>
                <input
                  type="number"
                  name="marks"
                  placeholder="Enter marks"
                  value={formData.marks}
                  onChange={handleAddFormChange}
                  required
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div className="form-group">
                <label>Remarks (Optional)</label>
                <textarea
                  name="remarks"
                  placeholder="Additional comments about the performance"
                  value={formData.remarks}
                  onChange={handleAddFormChange}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading || teacherSubjects.length === 0}>
                  {loading ? 'Adding...' : 'Add Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Marks Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Marks</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateMarks}>
              <div className="info-display">
                <div className="info-row">
                  <strong>Subject:</strong> {selectedMarks?.subjectName} ({selectedMarks?.subjectId})
                </div>
                <div className="info-row">
                  <strong>Exam Type:</strong> {selectedMarks?.examType}
                </div>
              </div>

              <div className="form-group">
                <label>Marks (0-100) *</label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  required
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows="3"
                  placeholder="Update remarks if needed"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subjects Modal */}
      <AddSubjectsModal 
        isOpen={showSubjectsModal}
        onClose={() => setShowSubjectsModal(false)}
        onSubjectsAdded={() => {
          fetchTeacherSubjects();
          toast.success('Subjects updated! You can now add marks for these subjects.');
        }}
      />
    </div>
  );
};

export default TeacherDashboard;