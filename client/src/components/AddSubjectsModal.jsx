import React, { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';

const AddSubjectsModal = ({ isOpen, onClose, onSubjectsAdded }) => {
  const [subjects, setSubjects] = useState([{ subjectId: '', subjectName: '' }]);
  const [loading, setLoading] = useState(false);

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index][field] = value;
    setSubjects(updatedSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subjectId: '', subjectName: '' }]);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const updatedSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(updatedSubjects);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validSubjects = subjects.filter(s => s.subjectId.trim() && s.subjectName.trim());
    if (validSubjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    // Check for duplicate subject IDs
    const subjectIds = validSubjects.map(s => s.subjectId);
    const hasDuplicates = new Set(subjectIds).size !== subjectIds.length;
    if (hasDuplicates) {
      toast.error('Duplicate subject IDs are not allowed');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/add-subjects', { subjects: validSubjects });
      toast.success(response.data.message);
      onSubjectsAdded();
      onClose();
      setSubjects([{ subjectId: '', subjectName: '' }]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subjects');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Add Subjects to Your Profile</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <p className="modal-description">
          Add subjects that you teach. You can only add marks for subjects in this list.
        </p>
        <form onSubmit={handleSubmit}>
          {subjects.map((subject, index) => (
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
              {subjects.length > 1 && (
                <button type="button" onClick={() => removeSubject(index)} className="remove-subject-btn">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          
          <button type="button" onClick={addSubject} className="add-more-btn">
            <Plus size={16} /> Add Another Subject
          </button>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Subjects'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubjectsModal;