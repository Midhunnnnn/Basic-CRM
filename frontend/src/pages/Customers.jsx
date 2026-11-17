import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Building,
  Mail,
  Phone,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { customerService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Customers.css';

const Customers = () => {
  const { formatDate } = useSettings();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  //alert msg
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', text }

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  //del confirm modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });

  // form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pull search from url query if coming from navbar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [location.search]);

  // get custs from api
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status = statusFilter;

      const response = await customerService.getAll(params);
      setCustomers(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      showAlert('error', 'Failed to retrieve customers from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //debounce search a bit
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // open add modal
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  //open edit modal
  const handleOpenEditModal = (cust) => {
    setIsEditing(true);
    setEditingId(cust.id);
    setFormData({
      name: cust.name || '',
      email: cust.email || '',
      phone: cust.phone || '',
      company: cust.company || '',
      status: cust.status || 'Active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // check form inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // handle save
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (isEditing) {
        await customerService.update(editingId, formData);
        showAlert('success', `Customer "${formData.name}" updated successfully.`);
      } else {
        await customerService.create(formData);
        showAlert('success', `Customer "${formData.name}" added successfully.`);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  // del costmr
  const handleDeleteCustomer = async () => {
    try {
      const { customerId, customerName } = deleteConfirmModal;
      await customerService.delete(customerId);
      showAlert('success', `Customer "${customerName}" deleted successfully.`);
      setDeleteConfirmModal({ isOpen: false, customerId: null, customerName: '' });
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Customers</h1>
          <p>Manage customer contacts, company details, accounts and relationship history</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchCustomers} title="Refresh customer table">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            Add Customer
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

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="customers-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by customer name, email or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <div className="filter-item">
              <Filter size={16} color="var(--text-muted)" />
              <label htmlFor="statusFilter" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Status:
              </label>
              <select
                id="statusFilter"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {(search || statusFilter !== 'All') && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
            <p>Loading customers from MySQL...</p>
          </div>
        ) : customers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust.id}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>#{cust.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cust.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Mail size={14} color="var(--text-light)" />
                      {cust.email || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Phone size={14} color="var(--text-light)" />
                      {cust.phone || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="var(--text-light)" />
                      {cust.company || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${(cust.status || 'Active').toLowerCase()}`}>
                      {cust.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Calendar size={13} color="var(--text-light)" />
                      {formatDate(cust.created_at)}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleOpenEditModal(cust)}
                        title="Edit Customer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => setDeleteConfirmModal({
                          isOpen: true,
                          customerId: cust.id,
                          customerName: cust.name
                        })}
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Users size={42} />
            <h4>No Customers Found</h4>
            <p>
              {search || statusFilter !== 'All'
                ? 'No customer records match your filter criteria.'
                : 'Start building your database by creating your first customer.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <UserPlus size={16} />
              Add Customer
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Customer Details' : 'Add New Customer'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Customer Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g. John Doe or Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className={`form-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="e.g. john@example.com"
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
                      placeholder="e.g. +1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
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
                  {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmModal({ isOpen: false, customerId: null, customerName: '' })}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Confirm Deletion</h3>
              <button
                className="btn-icon"
                onClick={() => setDeleteConfirmModal({ isOpen: false, customerId: null, customerName: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                Are you sure you want to delete customer <strong>{deleteConfirmModal.customerName}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Note: Associated sales records linked to this customer in MySQL will also be affected. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmModal({ isOpen: false, customerId: null, customerName: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteCustomer}
              >
                Yes, Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
