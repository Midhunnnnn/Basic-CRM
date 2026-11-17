import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PlusCircle,
  Trash2,
  X,
  Check,
  AlertCircle,
  Calendar,
  Building,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Search
} from 'lucide-react';
import { salesService, customerService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import StatCard from '../components/StatCard';
import '../styles/Sales.css';

const Sales = () => {
  const { settings, formatCurrency, getCurrencySymbol, getCurrencyIcon, formatDate } = useSettings();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [search, setSearch] = useState('');

  //alert
  const [alert, setAlert] = useState(null);

  // new sale modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: '',
    sale_date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  //del modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    saleId: null,
    customerName: '',
    amount: 0
  });

  // Load sales + cstmr list
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [salesRes, custRes] = await Promise.all([
        salesService.getAll(),
        customerService.getAll()
      ]);

      setSales(salesRes.data?.data || []);
      setTotalRevenue(salesRes.data?.totalRevenue || 0);
      setCustomers(custRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
      showAlert('error', 'Failed to retrieve sales records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // open add sale
  const handleOpenAddModal = () => {
    setFormData({
      customer_id: customers.length > 0 ? customers[0].id : '',
      amount: '',
      sale_date: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  //check fields
  const validateForm = () => {
    const errors = {};
    if (!formData.customer_id) {
      errors.customer_id = 'Please select a customer';
    }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = 'Please enter a valid positive sale amount';
    }
    if (!formData.sale_date) {
      errors.sale_date = 'Sale date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // save sale
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await salesService.create({
        customer_id: parseInt(formData.customer_id, 10),
        amount: parseFloat(formData.amount),
        sale_date: formData.sale_date
      });
      showAlert('success', `Sale of ${formatCurrency(formData.amount)} recorded successfully!`);
      setIsModalOpen(false);
      fetchSalesData();
    } catch (err) {
      console.error('Error creating sale:', err);
      showAlert('error', err.response?.data?.message || 'Failed to create sales record.');
    } finally {
      setSubmitting(false);
    }
  };

  // del sale
  const handleDeleteSale = async () => {
    try {
      const { saleId, amount } = deleteModal;
      await salesService.delete(saleId);
      showAlert('success', `Sale record of ${formatCurrency(amount)} deleted successfully.`);
      setDeleteModal({ isOpen: false, saleId: null, customerName: '', amount: 0 });
      fetchSalesData();
    } catch (err) {
      console.error('Error deleting sale:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete sale.');
    }
  };

  //filter by cust name/email
  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (s.customer_name && s.customer_name.toLowerCase().includes(term)) ||
      (s.customer_email && s.customer_email.toLowerCase().includes(term)) ||
      (s.amount && s.amount.toString().includes(term))
    );
  });

  const averageDealSize = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Sales Management</h1>
          <p>Record transactions, calculate revenue, and review deal history linked to customers</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchSalesData} title="Refresh sales table">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <PlusCircle size={16} />
            Record New Sale
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

      {/* Sales Summary Statistics */}
      <div className="sales-summary-grid">
        <StatCard
          title="Total Closed Revenue"
          value={formatCurrency(totalRevenue)}
          description="Sum of all recorded transactions in MySQL"
          icon={getCurrencyIcon()}
          color="green"
        />
        <StatCard
          title="Total Deals Closed"
          value={sales.length}
          description="Volume of completed customer sales"
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Average Deal Size"
          value={formatCurrency(averageDealSize)}
          description="Average revenue per closed deal"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Search Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="customers-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by customer name, email or amount..."
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

      {/* Sales Records Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
            <p>Loading sales records...</p>
          </div>
        ) : filteredSales.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Sale ID</th>
                <th>Customer Name</th>
                <th>Customer Contact</th>
                <th>Sale Date</th>
                <th>Amount ({getCurrencySymbol()})</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>#{sale.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {sale.customer_name}
                    </div>
                    {sale.customer_company && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {sale.customer_company}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {sale.customer_email || 'No email registered'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Calendar size={13} color="var(--text-light)" />
                      {formatDate(sale.sale_date)}
                    </div>
                  </td>
                  <td>
                    <span className="sale-amount-highlight">
                      {formatCurrency(sale.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon delete"
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          saleId: sale.id,
                          customerName: sale.customer_name,
                          amount: sale.amount
                        })}
                        title="Delete Sale Record"
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
            <DollarSign size={42} />
            <h4>No Sales Records Found</h4>
            <p>
              {search
                ? 'No transactions match your search filter.'
                : 'There are no sales transactions yet. Click below to record your first sale.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <PlusCircle size={16} />
              Record First Sale
            </button>
          </div>
        )}
      </div>

      {/* Record New Sale Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record New Sale Transaction</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Select Customer <span className="required">*</span>
                  </label>
                  {customers.length > 0 ? (
                    <select
                      className={`form-select ${formErrors.customer_id ? 'error' : ''}`}
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    >
                      <option value="">-- Choose an existing customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--danger)', padding: '6px 0' }}>
                      No customers found in database. Please create a customer first!
                    </div>
                  )}
                  {formErrors.customer_id && (
                    <div className="form-error">{formErrors.customer_id}</div>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Sale Amount ({getCurrencySymbol()}) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`form-input ${formErrors.amount ? 'error' : ''}`}
                      placeholder="e.g. 2500.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    {formErrors.amount && <div className="form-error">{formErrors.amount}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Sale Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-input ${formErrors.sale_date ? 'error' : ''}`}
                      value={formData.sale_date}
                      onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                    />
                    {formErrors.sale_date && (
                      <div className="form-error">{formErrors.sale_date}</div>
                    )}
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
                  disabled={submitting || customers.length === 0}
                >
                  {submitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sale Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, saleId: null, customerName: '', amount: 0 })}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Delete Sale Record</h3>
              <button
                className="btn-icon"
                onClick={() => setDeleteModal({ isOpen: false, saleId: null, customerName: '', amount: 0 })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                Are you sure you want to delete transaction <strong>#{deleteModal.saleId}</strong> for{' '}
                <strong>{deleteModal.customerName}</strong> worth{' '}
                <strong>{formatCurrency(deleteModal.amount)}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                This will reduce the calculated total revenue in the dashboard.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, saleId: null, customerName: '', amount: 0 })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteSale}
              >
                Yes, Delete Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
