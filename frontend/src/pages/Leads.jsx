import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Compass,
  Calendar,
  RefreshCw,
  ArrowRightCircle
} from 'lucide-react';
import { leadService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Leads.css';

const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];

const LEAD_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Google Ads',
  'Cold Call',
  'Email Campaign',
  'Trade Show / Event',
  'Other'
];

const Leads = () => {
  const { formatDate } = useSettings();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // alert banner
  const [alert, setAlert] = useState(null);

  // modal flags
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  //del confirm
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    leadId: null,
    leadName: ''
  });

  //form values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // get lds from api
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status = statusFilter;

      const response = await leadService.getAll(params);
      setLeads(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      showAlert('error', 'Failed to retrieve leads from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLeads();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  //add modal
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'Website',
      status: 'New'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // edit lead modal
  const handleOpenEditModal = (lead) => {
    setIsEditing(true);
    setEditingId(lead.id);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'Website',
      status: lead.status || 'New'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  //inline status update
  const handleQuickStatusChange = async (lead, newStatus) => {
    try {
      await leadService.update(lead.id, {
        ...lead,
        status: newStatus
      });
      showAlert('success', `Lead "${lead.name}" moved to "${newStatus}".`);
      fetchLeads();
    } catch (err) {
      console.error('Error updating status:', err);
      showAlert('error', 'Failed to update lead status.');
    }
  };

  // check lead inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Lead name is required';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  //save lead
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (isEditing) {
        await leadService.update(editingId, formData);
        showAlert('success', `Lead "${formData.name}" updated successfully.`);
      } else {
        await leadService.create(formData);
        showAlert('success', `Lead "${formData.name}" added to pipeline.`);
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Error saving lead:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save lead.');
    } finally {
      setSubmitting(false);
    }
  };

  // confirm del
  const handleDeleteLead = async () => {
    try {
      const { leadId, leadName } = deleteModal;
      await leadService.delete(leadId);
      showAlert('success', `Lead "${leadName}" removed from pipeline.`);
      setDeleteModal({ isOpen: false, leadId: null, leadName: '' });
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete lead.');
    }
  };

  // Count leads per status for pipeline chips
  const statusCounts = leads.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Lead Management</h1>
          <p>Track potential clients from initial contact through qualification and conversion</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchLeads} title="Refresh lead pipeline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            Add New Lead
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

      {/* Pipeline Status Summary Chips */}
      <div className="leads-pipeline-summary">
        <div
          className={`pipeline-chip ${statusFilter === 'All' ? 'active' : ''}`}
          onClick={() => setStatusFilter('All')}
        >
          <span className="pipeline-label">All Leads</span>
          <span className="pipeline-count">{leads.length}</span>
        </div>
        {LEAD_STATUSES.map((status) => (
          <div
            key={status}
            className={`pipeline-chip ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            <span className="pipeline-label">{status}</span>
            <span className="pipeline-count" style={{ color: `var(--${status.toLowerCase()}-text, inherit)` }}>
              {statusCounts[status] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="customers-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search leads by name, email, or source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <div className="filter-item">
              <Filter size={16} color="var(--text-muted)" />
              <label htmlFor="leadStatusSelect" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Status:
              </label>
              <select
                id="leadStatusSelect"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {LEAD_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
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
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
            <p>Loading sales leads...</p>
          </div>
        ) : leads.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Lead Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lead Source</th>
                <th>Status (Pipeline Stage)</th>
                <th>Date Added</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>#{lead.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Mail size={14} color="var(--text-light)" />
                      {lead.email || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Phone size={14} color="var(--text-light)" />
                      {lead.phone || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '13px' }}>
                      <Compass size={14} color="var(--text-light)" />
                      {lead.source || 'Direct'}
                    </div>
                  </td>
                  <td>
                    {/* Quick status selector */}
                    <select
                      className={`badge badge-${lead.status.toLowerCase()}`}
                      style={{ cursor: 'pointer', outline: 'none', border: 'none', padding: '4px 8px', fontWeight: 600 }}
                      value={lead.status}
                      onChange={(e) => handleQuickStatusChange(lead, e.target.value)}
                      title="Click to update lead status"
                    >
                      {LEAD_STATUSES.map(st => (
                        <option key={st} value={st} style={{ background: '#fff', color: '#0f172a' }}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Calendar size={13} color="var(--text-light)" />
                      {formatDate(lead.created_at)}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleOpenEditModal(lead)}
                        title="Edit Lead Information"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          leadId: lead.id,
                          leadName: lead.name
                        })}
                        title="Delete Lead"
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
            <UserCheck size={42} />
            <h4>No Leads Found</h4>
            <p>
              {search || statusFilter !== 'All'
                ? 'No leads found matching the filter criteria.'
                : 'Your pipeline is ready for incoming leads. Add your first prospect.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <UserPlus size={16} />
              Add New Lead
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Lead Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Lead Information' : 'Add New Lead'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g. Alex Henderson"
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
                      placeholder="e.g. alex@prospect.com"
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
                      placeholder="e.g. +1 (555) 345-6789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Lead Source</label>
                    <select
                      className="form-select"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      {LEAD_SOURCES.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pipeline Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {LEAD_STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
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
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lead Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, leadId: null, leadName: '' })}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Delete Lead</h3>
              <button
                className="btn-icon"
                onClick={() => setDeleteModal({ isOpen: false, leadId: null, leadName: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                Are you sure you want to permanently remove lead <strong>{deleteModal.leadName}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                This record will be deleted from MySQL.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, leadId: null, leadName: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteLead}
              >
                Yes, Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
