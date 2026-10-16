import React, { useState, useEffect } from 'react';
import { Input, Select, ValidatedForm, SubmitButton } from '../../common/FormControls';

function EmployeeModal({ employee, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    role: 'Front Desk Concierge',
    salary: '',
    start: '',
    end: '',
    status: 'Active',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        id: employee.id || null,
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'Front Desk Concierge',
        salary: employee.salary || '',
        start: employee.start || '',
        end: employee.end || '',
        status: employee.status || 'Active',
        password: employee.password || '',
      });
    } else {
      setFormData({
        id: null,
        name: '',
        email: '',
        role: 'Front Desk Concierge',
        salary: '',
        start: '',
        end: '',
        status: 'Active',
        password: '',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    if (formData.id) {
      onDelete(formData.id);
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="modal-overlay open">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 600, letterSpacing: '-0.01em' }}>
            <i className="fas fa-user-edit" style={{ color: 'var(--gold)', marginRight: 10 }}></i>
            {formData.id ? 'Edit Employee' : 'New Employee'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>View, edit, and save staff records.</p>
        </div>

        <ValidatedForm onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginTop: 0 }}>
            <label>Full Name <span className="required">*</span></label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Account Email <span className="required">*</span></label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@jofiane.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button type="button" className="password-toggle" onClick={togglePassword}>
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginTop: 0 }}>
              <label>Position / Role</label>
              <Select name="role" value={formData.role} onChange={handleChange}>
                <option>Front Desk Concierge</option>
                <option>Night Auditor</option>
                <option>Housekeeping Lead</option>
                <option>Maintenance Tech</option>
                <option>Bellhop</option>
                <option>Manager</option>
              </Select>
            </div>
            <div className="form-group" style={{ marginTop: 0 }}>
              <label>Monthly Salary (₱)</label>
              <Input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginTop: 0 }}>
              <label>Shift Start</label>
              <Input
                type="time"
                name="start"
                value={formData.start}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ marginTop: 0 }}>
              <label>Shift End</label>
              <Input
                type="time"
                name="end"
                value={formData.end}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Account Status</label>
            <Select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active — Full Access</option>
              <option value="On Leave">On Leave — Suspended</option>
              <option value="Terminated">Terminated — Revoked</option>
            </Select>
          </div>

          <hr className="modal-divider" />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {formData.id && (
              <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                <i className="fas fa-trash"></i> Delete
              </button>
            )}
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <SubmitButton className="btn btn-gold" style={{ flex: 2 }}>
              <i className="fas fa-save"></i> {formData.id ? 'Update' : 'Create'}
            </SubmitButton>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}

export default EmployeeModal;
