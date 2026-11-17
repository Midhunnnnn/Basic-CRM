import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Mail,
  Phone,
  ShieldCheck,
  Shield,
  User,
  Briefcase,
  Building,
  RefreshCw,
  Lock
} from 'lucide-react';
import { employeeService, authService } from '../services/api';
import '../styles/Employees.css';

const DEPARTMENTS = [
  'Sales & Marketing',
  'Customer Support',
  'Engineering & IT',
  'Human Resources',
  'Finance & Accounting',
  'Operations',
  'Executive Management'
];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  //modal stuff
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // del modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    employeeId: null,
    employeeName: '',
    role: ''
  });

  // form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Sales & Marketing',
    designation: '',
    role: 'Employee', // def role for new emps
    password: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  //current super admin
  const currentUser = authService.getUser();

  // load employes from api
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();

      const response = await employeeService.getAll(params);
      setEmployees(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      showAlert('error', err.response?.data?.message || 'Failed to retrieve employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // open add emp modal
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Sales & Marketing',
      designation: '',
      role: 'Employee',
      password: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  //edit employee modal
  const handleOpenEditModal = (emp) => {
    setIsEditing(true);
    setEditingId(emp.id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Sales & Marketing',
      designation: emp.designation || '',
      role: emp.role || 'Employee',
      password: '', // leave empty unless changing pwd
      status: emp.status || 'Active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // pwd reqd for new emp
    if (!isEditing && (!formData.password || formData.password.length < 4)) {
      errors.password = 'Password must be at least 4 characters long';
    }

    // if changing pass on edit, min 4 chars
    if (isEditing && formData.password && formData.password.length < 4) {
      errors.password = 'Password must be at least 4 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  //submit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (isEditing) {
        await employeeService.update(editingId, formData);
        showAlert('success', `Employee "${formData.name}" updated successfully.`);
      } else {
        await employeeService.create(formData);
        showAlert('success', `Employee "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setSubmitting(false);
    }
  };

  // flip active/inactive
  const handleToggleStatus = async (emp) => {
    if (emp.role === 'Super Admin') {
      showAlert('error', 'Cannot deactivate the Super Admin account.');
      return;
    }

    try {
      const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
      await employeeService.updateStatus(emp.id, nextStatus);
      showAlert('success', `Status for "${emp.name}" changed to ${nextStatus}.`);
      fetchEmployees();
    } catch (err) {
      console.error('Error updating status:', err);
      showAlert('error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  // confirm & del employe
  const handleDeleteEmployee = async () => {
    try {
      const { employeeId, employeeName } = deleteModal;
      await employeeService.delete(employeeId);
      showAlert('success', `Employee "${employeeName}" deleted successfully.`);
      setDeleteModal({ isOpen: false, employeeId: null, employeeName: '', role: '' });
      fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  // role badge helper
  const renderRoleBadge = (role) => {
    if (role === 'Super Admin') {
      return (
        <span className="role-badge role-super-admin">
          <ShieldCheck size={13} /> Super Admin
        </span>
      );
    }
    if (role === 'Admin') {
      return (
        <span className="role-badge role-admin">
          <Shield size={13} /> Admin
        </span>
      );
    }
    return (
      <span className="role-badge role-employee">
        <User size={13} /> Employee
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Employee Management</h1>
          <p>Super Admin control center: manage team members, access roles, and system permissions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchEmployees} title="Refresh list">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`alert-banner alert-${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{alert.text}</span>
          </div>
          <button className="btn-icon" onClick={() => setAlert(null)} style={{ padding: '2px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="customers-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, email, department, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => setSearch('')}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
            <p>Loading employee directory...</p>
          </div>
        ) : employees.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>#{emp.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {emp.name}
                      {currentUser?.id === emp.id && (
                        <span style={{ fontSize: '11px', color: 'var(--primary)', marginLeft: '6px', fontWeight: 500 }}>
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Mail size={14} color="var(--text-light)" />
                      {emp.email}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Phone size={14} color="var(--text-light)" />
                      {emp.phone || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="var(--text-light)" />
                      {emp.department || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '13px' }}>
                      <Briefcase size={14} color="var(--text-light)" />
                      {emp.designation || 'Staff'}
                    </div>
                  </td>
                  <td>{renderRoleBadge(emp.role)}</td>
                  <td>
                    <button
                      className="status-toggle-btn"
                      onClick={() => handleToggleStatus(emp)}
                      disabled={emp.role === 'Super Admin'}
                      title={emp.role === 'Super Admin' ? 'Super Admin cannot be deactivated' : 'Click to toggle status'}
                    >
                      <span className={`badge badge-${emp.status.toLowerCase()} status-pill`}>
                        {emp.status}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleOpenEditModal(emp)}
                        title="Edit Employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      {emp.role !== 'Super Admin' && (
                        <button
                          className="btn-icon delete"
                          onClick={() => setDeleteModal({
                            isOpen: true,
                            employeeId: emp.id,
                            employeeName: emp.name,
                            role: emp.role
                          })}
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Users size={42} />
            <h4>No Employees Found</h4>
            <p>
              {search
                ? 'No employee records match your search.'
                : 'Start assembling your team by adding the first employee.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <UserPlus size={16} />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Employee Information' : 'Add New Employee'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g. Rachel Green"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>

                {/* Email & Phone */}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="e.g. rachel@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +1 (555) 234-5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Department & Designation */}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation / Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Sales Specialist"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                </div>

                {/* Role & Status */}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      System Access Role <span className="required">*</span>
                    </label>
                    {/* Super Admin can only assign Admin or Employee */}
                    {isEditing && formData.role === 'Super Admin' ? (
                      <input
                        type="text"
                        className="form-input"
                        value="Super Admin"
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b' }}
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="Employee">Employee (Standard Access)</option>
                        <option value="Admin">Admin (Management Access)</option>
                      </select>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Note: Super Admin accounts cannot be created from this form.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isEditing && formData.role === 'Super Admin'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <label className="form-label">
                    {isEditing ? 'New Password (leave blank to keep current)' : 'Account Password'}
                    {!isEditing && <span className="required">*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className={`form-input ${formErrors.password ? 'error' : ''}`}
                      placeholder={isEditing ? 'Enter new password if changing' : 'Minimum 4 characters'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  {formErrors.password && <div className="form-error">{formErrors.password}</div>}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Passwords are encrypted with bcryptjs before being stored in MySQL.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '', role: '' })}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Confirm Deletion</h3>
              <button
                className="btn-icon"
                onClick={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '', role: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                Are you sure you want to delete employee <strong>{deleteModal.employeeName}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                This will remove their profile and login access from MySQL.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '', role: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteEmployee}
              >
                Yes, Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
