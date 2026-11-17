import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Percent,
  Calendar,
  Printer,
  RefreshCw,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { dashboardService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import StatCard from '../components/StatCard';
import '../styles/Reports.css';

const Reports = () => {
  const { formatCurrency, getCurrencySymbol, getCurrencyIcon } = useSettings();
  const [stats, setStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [leadAnalysis, setLeadAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [statsRes, salesRes, leadRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMonthlySales(),
        dashboardService.getLeadAnalysis()
      ]);

      setStats(statsRes.data?.data || null);
      setMonthlySales(salesRes.data?.data || []);
      setLeadAnalysis(leadRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-container">
          <div className="spinner" />
          <p>Compiling CRM reports & analytics...</p>
        </div>
      </div>
    );
  }

  const conversionPercentage = stats?.conversionRate || 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Analytics & Reports</h1>
          <p>Comprehensive performance overview, sales trends and conversion statistics</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchReportData} title="Refresh report">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="reports-summary-grid">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          description="Active client accounts"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          description="Total qualified opportunities"
          icon={UserCheck}
          color="amber"
        />
        <StatCard
          title="Converted Leads"
          value={stats?.convertedLeads || 0}
          description="Successfully converted to clients"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          description="Cumulative sales volume"
          icon={getCurrencyIcon()}
          color="purple"
        />
        <StatCard
          title="Lead Conversion Rate"
          value={`${conversionPercentage}%`}
          description="(Converted / Total Leads) × 100"
          icon={Percent}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="reports-charts-row">
        {/* Monthly Revenue Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Monthly Revenue Performance</h2>
              <p className="card-subtitle">Aggregated transaction values per billing cycle</p>
            </div>
            <TrendingUp size={20} color="var(--primary)" />
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `${getCurrencySymbol()}${val.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(val) => [`${formatCurrency(val)}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No transaction history available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lead Conversion Progress Card */}
        <div className="card conversion-funnel-card">
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Conversion Performance</h2>
                <p className="card-subtitle">Lead to customer conversion benchmark</p>
              </div>
            </div>

            <div className="conversion-meter">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Overall Conversion Ratio</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-text)' }}>
                  {conversionPercentage}%
                </span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.min(conversionPercentage, 100)}%` }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {stats?.convertedLeads || 0} out of {stats?.totalLeads || 0} leads converted to active customers.
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                Pipeline Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leadAnalysis.map((item) => {
                  const leadTotal = stats?.totalLeads || 1;
                  const pct = ((item.value / leadTotal) * 100).toFixed(1);
                  return (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span className={`badge badge-${item.name.toLowerCase()}`}>{item.name}</span>
                      <span style={{ fontWeight: 600 }}>
                        {item.value} leads <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> MySQL Data refreshed in real-time
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Sales Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Monthly Sales Summary Report</h2>
            <p className="card-subtitle">Month-by-month financial summary</p>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          {monthlySales.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Closed Transactions</th>
                  <th>Total Monthly Revenue</th>
                  <th>Average Transaction Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlySales.map((m) => {
                  const avg = m.salesCount > 0 ? m.revenue / m.salesCount : 0;
                  return (
                    <tr key={m.monthKey || m.month}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} color="var(--primary)" />
                          {m.month}
                        </div>
                      </td>
                      <td>{m.salesCount} Deals</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatCurrency(m.revenue)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(avg)}
                      </td>
                      <td>
                        <span className="badge badge-active">Recorded</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No monthly transaction records available for report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
