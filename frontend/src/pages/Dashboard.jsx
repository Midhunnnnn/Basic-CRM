import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  Building,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import { dashboardService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Dashboard.css';

// lead status colors
const STATUS_COLORS = {
  New: '#0284c7',
  Contacted: '#f59e0b',
  Interested: '#8b5cf6',
  Converted: '#10b981',
  Lost: '#ef4444'
};

const Dashboard = () => {
  const { formatCurrency, getCurrencySymbol, getCurrencyIcon, formatDate } = useSettings();
  const [stats, setStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [leadAnalysis, setLeadAnalysis] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [recentData, setRecentData] = useState({ recentCustomers: [], recentLeads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all dashbord stats from api
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, salesRes, leadsRes, growthRes, recentRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMonthlySales(),
        dashboardService.getLeadAnalysis(),
        dashboardService.getCustomerGrowth(),
        dashboardService.getRecentActivity()
      ]);

      setStats(statsRes.data?.data || null);
      setMonthlySales(salesRes.data?.data || []);
      setLeadAnalysis(leadsRes.data?.data || []);
      setCustomerGrowth(growthRes.data?.data || []);
      setRecentData(recentRes.data?.data || { recentCustomers: [], recentLeads: [] });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load database analytics. Please ensure MySQL and backend server are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-container">
          <div className="spinner" />
          <p>Loading CRM dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Business Performance Dashboard</h1>
          <p>Real-time analytics, customer growth, leads pipeline, and revenue metrics</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchDashboardData} title="Refresh data">
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link to="/customers" className="btn btn-primary">
            Manage Customers
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-banner alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ padding: '4px 10px', fontSize: '12px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Section 1: 4 Statistics Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          description="Registered client base in database"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          description="Prospects in sales pipeline"
          icon={UserPlus}
          color="amber"
        />
        <StatCard
          title="Converted Leads"
          value={stats?.convertedLeads || 0}
          description={`${stats?.conversionRate || 0}% overall conversion rate`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          description="Aggregated closed transactions"
          icon={getCurrencyIcon()}
          color="purple"
        />
      </div>

      {/* Section 2: Analytics Charts (Monthly Revenue Line Chart & Lead Status Pie Chart) */}
      <div className="dashboard-charts-grid">
        {/* 1. Monthly Revenue Analysis (Line Chart) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Monthly Revenue Analysis</h2>
              <p className="card-subtitle">Monthly transaction volume recorded in MySQL</p>
            </div>
            <TrendingUp size={20} color="var(--primary)" />
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `${getCurrencySymbol()}${val.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(val) => [`${formatCurrency(val)}`, 'Revenue']}
                    labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No sales records found yet to plot monthly trends.</p>
                <Link to="/sales" className="btn btn-secondary">Record a Sale</Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. Lead Status Analysis (Pie Chart) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Lead Status Analysis</h2>
              <p className="card-subtitle">Pipeline distribution by stage</p>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            {leadAnalysis.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadAnalysis}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadAnalysis.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Leads`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="square" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No lead records available.</p>
                <Link to="/leads" className="btn btn-secondary">Add New Lead</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Customer Growth Over Time (Bar Chart) */}
      <div className="card growth-chart-section">
        <div className="card-header">
          <div>
            <h2 className="card-title">Customer Registration Growth</h2>
            <p className="card-subtitle">New customer acquisition count per month</p>
          </div>
          <span className="badge badge-active">
            +{customerGrowth.reduce((acc, curr) => acc + curr.newCustomers, 0)} Total Added
          </span>
        </div>

        <div style={{ height: '260px', width: '100%' }}>
          {customerGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowth} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} Customers`, 'Registrations']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px'
                  }}
                />
                <Bar dataKey="newCustomers" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No customer registration history available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Recent Customers Table & Recent Activities */}
      <div className="dashboard-bottom-grid">
        {/* Recent Customers Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Customers</h2>
              <p className="card-subtitle">Latest clients added to database</p>
            </div>
            <Link to="/customers" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            {recentData.recentCustomers.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentData.recentCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 600 }}>{cust.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{cust.email || '—'}</td>
                      <td>{cust.company || '—'}</td>
                      <td>
                        <span className={`badge badge-${(cust.status || 'Active').toLowerCase()}`}>
                          {cust.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/customers?search=${encodeURIComponent(cust.name)}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No customers added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities Panel */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Activity</h2>
              <p className="card-subtitle">Latest lead updates and touches</p>
            </div>
            <Clock size={18} color="var(--text-light)" />
          </div>

          <div className="activity-list">
            {recentData.recentLeads.length > 0 ? (
              recentData.recentLeads.map((lead) => (
                <div key={lead.id} className="activity-item">
                  <div
                    className="activity-icon-wrapper"
                    style={{
                      backgroundColor: STATUS_COLORS[lead.status] ? `${STATUS_COLORS[lead.status]}18` : '#f1f5f9',
                      color: STATUS_COLORS[lead.status] || '#64748b'
                    }}
                  >
                    <UserCheck size={16} />
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{lead.name}</div>
                    <div className="activity-sub">
                      Stage: <strong>{lead.status}</strong> • Source: {lead.source || 'Direct'}
                    </div>
                  </div>
                  <span className={`badge badge-${lead.status.toLowerCase()}`}>
                    {lead.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No recent activity recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
