import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen, Filter, Calendar, Download } from 'lucide-react';
import './Dashboard.css';

const StudentDashboard = () => {
  const [marks, setMarks] = useState([]);
  const [averages, setAverages] = useState({ subjectAverages: [], overallAverage: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [chartType, setChartType] = useState('bar'); // bar, line, area
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const [marksRes, avgRes] = await Promise.all([
        axios.get('/marks'),
        axios.get(`/marks/average/${user?.id}`)
      ]);
      
      setMarks(marksRes.data.marks);
      setAverages(avgRes.data);
      
      // Extract unique subjects from marks
      const uniqueSubjects = [...new Set(marksRes.data.marks.map(m => m.subjectId))];
      const subjectList = uniqueSubjects.map(subjectId => {
        const mark = marksRes.data.marks.find(m => m.subjectId === subjectId);
        return {
          subjectId: mark.subjectId,
          subjectName: mark.subjectName
        };
      });
      setSubjects(subjectList);
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 45) return '#f59e0b';
    return '#ef4444';
  };

  const getGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
  };

  // Filter marks by selected subject
  const getFilteredMarks = () => {
    if (selectedSubject === 'all') {
      return marks;
    }
    return marks.filter(m => m.subjectId === selectedSubject);
  };

  // Prepare data for subject-wise performance chart
  const getSubjectPerformanceData = () => {
    const filteredMarks = getFilteredMarks();
    
    if (selectedSubject === 'all') {
      // Show average per subject
      return averages.subjectAverages.map(sub => ({
        name: sub.subject,
        average: sub.averageMarks,
        highest: sub.highestMarks,
        lowest: sub.lowestMarks,
        exams: sub.totalExams
      }));
    } else {
      // Show all exams for selected subject
      const subjectMarks = marks.filter(m => m.subjectId === selectedSubject);
      return subjectMarks.map((mark, index) => ({
        name: `${mark.examType} ${subjectMarks.length > 1 ? index + 1 : ''}`,
        marks: mark.marks,
        examType: mark.examType,
        date: new Date(mark.date).toLocaleDateString()
      }));
    }
  };

  // Prepare data for progress trend chart
  const getProgressData = () => {
    const filteredMarks = getFilteredMarks();
    return filteredMarks
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((mark, index) => ({
        exam: `${mark.examType}${filteredMarks.length > 1 ? ` ${index + 1}` : ''}`,
        marks: mark.marks,
        subject: mark.subjectName,
        date: new Date(mark.date).toLocaleDateString()
      }));
  };

  // Prepare data for pie chart (exam type distribution)
  const getExamTypeDistribution = () => {
    const filteredMarks = getFilteredMarks();
    const distribution = {};
    
    filteredMarks.forEach(mark => {
      if (!distribution[mark.examType]) {
        distribution[mark.examType] = { count: 0, totalMarks: 0 };
      }
      distribution[mark.examType].count++;
      distribution[mark.examType].totalMarks += mark.marks;
    });
    
    return Object.entries(distribution).map(([type, data]) => ({
      name: type,
      value: data.count,
      averageMarks: (data.totalMarks / data.count).toFixed(2)
    }));
  };

  const pieColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
  
  // Calculate statistics for filtered marks
  const getFilteredStats = () => {
    const filteredMarks = getFilteredMarks();
    if (filteredMarks.length === 0) return null;
    
    const totalMarks = filteredMarks.reduce((sum, m) => sum + m.marks, 0);
    const average = (totalMarks / filteredMarks.length).toFixed(2);
    const highest = Math.max(...filteredMarks.map(m => m.marks));
    const lowest = Math.min(...filteredMarks.map(m => m.marks));
    const subjectsCount = new Set(filteredMarks.map(m => m.subjectId)).size;
    
    return { average, highest, lowest, totalExams: filteredMarks.length, subjectsCount };
  };

  const filteredStats = getFilteredStats();
  const subjectPerformanceData = getSubjectPerformanceData();
  const progressData = getProgressData();
  const examTypeDistribution = getExamTypeDistribution();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((p, index) => (
            <p key={index} className="tooltip-value" style={{ color: p.color }}>
              {p.name}: {p.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your academic data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard student-dashboard">
      <div className="dashboard-header">
        <h1>My Academic Dashboard</h1>
        <p>Track your performance, analyze progress, and achieve more</p>
      </div>

      {/* Subject Filter Section */}
      <div className="filter-section">
        <div className="filter-controls">
          <Filter size={18} />
          <label>Filter by Subject:</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-filter"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectName}
              </option>
            ))}
          </select>
          
          {selectedSubject !== 'all' && (
            <button 
              className="clear-filter-btn"
              onClick={() => setSelectedSubject('all')}
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <div className="chart-type-controls">
          <button 
            className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
          <button 
            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </button>
          <button 
            className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            Area Chart
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <TrendingUp size={32} className="stat-icon" />
          <div className="stat-info">
            <h3>Overall Average</h3>
            <div className="stat-value">{filteredStats?.average || averages.overallAverage}%</div>
            <small>Based on {filteredStats?.totalExams || marks.length} exams</small>
          </div>
        </div>
        
        <div className="stat-card">
          <BookOpen size={32} className="stat-icon" />
          <div className="stat-info">
            <h3>Subjects</h3>
            <div className="stat-value">{filteredStats?.subjectsCount || subjects.length}</div>
            <small>Active subjects</small>
          </div>
        </div>
        
        <div className="stat-card">
          <Award size={32} className="stat-icon" />
          <div className="stat-info">
            <h3>Best Performance</h3>
            <div className="stat-value">{filteredStats?.highest || 'N/A'}%</div>
            <small>Highest score achieved</small>
          </div>
        </div>
        
        <div className="stat-card">
          <Target size={32} className="stat-icon" />
          <div className="stat-info">
            <h3>Areas to Improve</h3>
            <div className="stat-value">{filteredStats?.lowest || 'N/A'}%</div>
            <small>Lowest score</small>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="charts-container">
        {/* Subject Performance Chart */}
        <div className="chart-card">
          <h3>
            {selectedSubject === 'all' ? 'Subject-wise Performance' : `${subjects.find(s => s.subjectId === selectedSubject)?.subjectName} - Performance Analysis`}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'bar' && (
              <BarChart data={subjectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="average" fill="#6366f1" name="Average Score %">
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.average || entry.marks)} />
                  ))}
                </Bar>
                {selectedSubject !== 'all' && (
                  <Bar dataKey="marks" fill="#10b981" name="Marks Obtained" />
                )}
              </BarChart>
            )}
            
            {chartType === 'line' && (
              <LineChart data={subjectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="average" stroke="#6366f1" name="Average Score %" strokeWidth={2} />
                {selectedSubject !== 'all' && (
                  <Line type="monotone" dataKey="marks" stroke="#10b981" name="Marks Obtained" strokeWidth={2} />
                )}
              </LineChart>
            )}
            
            {chartType === 'area' && (
              <AreaChart data={subjectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="average" stackId="1" stroke="#6366f1" fill="#6366f1" name="Average Score %" />
                {selectedSubject !== 'all' && (
                  <Area type="monotone" dataKey="marks" stackId="2" stroke="#10b981" fill="#10b981" name="Marks Obtained" />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Progress Trend Chart */}
        {progressData.length > 0 && (
          <div className="chart-card">
            <h3>Performance Progress Trend</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#ec4899" name="Marks" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Exam Type Distribution */}
        {examTypeDistribution.length > 0 && (
          <div className="chart-card">
            <h3>Exam Type Distribution</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={examTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent, averageMarks }) => `${name}\n${(percent * 100).toFixed(0)}%\nAvg: ${averageMarks}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {examTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Marks Table */}
      <div className="marks-section">
        <div className="marks-header">
          <h3>Detailed Marks Record</h3>
          <div className="marks-stats">
            <span>📊 Total Records: {getFilteredMarks().length}</span>
          </div>
        </div>
        
        {getFilteredMarks().length === 0 ? (
          <div className="no-data-message">
            <p>No marks found for the selected filter.</p>
          </div>
        ) : (
          <div className="marks-table-container">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredMarks().map((mark, index) => {
                  const grade = getGrade(mark.marks);
                  return (
                    <tr key={mark._id || index}>
                      <td>
                        <strong>{mark.subjectName}</strong>
                        <small>{mark.subjectId}</small>
                      </td>
                      <td>{mark.examType}</td>
                      <td className={mark.marks >= 60 ? 'score-high' : mark.marks >= 40 ? 'score-medium' : 'score-low'}>
                        <strong>{mark.marks}/100</strong>
                      </td>
                      <td className="grade-cell">{grade}</td>
                      <td>{mark.remarks || '-'}</td>
                      <td>{new Date(mark.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {getFilteredMarks().length > 0 && (
        <div className="insights-section">
          <h3>📈 Performance Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Strengths</h4>
              <ul>
                {subjectPerformanceData
                  .filter(s => (s.average || s.marks) >= 70)
                  .slice(0, 3)
                  .map((s, i) => (
                    <li key={i}>✓ {s.name}: {(s.average || s.marks).toFixed(1)}%</li>
                  ))}
                {subjectPerformanceData.filter(s => (s.average || s.marks) >= 70).length === 0 && (
                  <li>Keep working hard! 📚</li>
                )}
              </ul>
            </div>
            <div className="insight-card">
              <h4>Areas for Improvement</h4>
              <ul>
                {subjectPerformanceData
                  .filter(s => (s.average || s.marks) < 60)
                  .slice(0, 3)
                  .map((s, i) => (
                    <li key={i}>⚠ {s.name}: {(s.average || s.marks).toFixed(1)}%</li>
                  ))}
                {subjectPerformanceData.filter(s => (s.average || s.marks) < 60).length === 0 && (
                  <li>Excellent performance! Keep it up! 🌟</li>
                )}
              </ul>
            </div>
            <div className="insight-card">
              <h4>Recommendations</h4>
              <ul>
                {filteredStats?.average > 80 && <li>🎯 Consider taking advanced courses</li>}
                {filteredStats?.average >= 60 && filteredStats?.average <= 80 && <li>📚 Consistent effort will lead to excellence</li>}
                {filteredStats?.average < 60 && <li>💪 Focus on weak subjects and practice more</li>}
                {progressData.length > 1 && progressData[progressData.length - 1].marks > progressData[0].marks && (
                  <li>📈 Great improvement trend! Keep the momentum!</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;