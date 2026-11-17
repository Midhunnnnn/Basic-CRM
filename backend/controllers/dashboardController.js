const { pool } = require('../config/db');

//get /api/dashbrd/stats
// calc total custs, total lds, converted leads, tot rev nd conversion rate
const getDashboardStats = async (req, res) => {
  try {
    // 1 totl custs
    const [custRows] = await pool.query('SELECT COUNT(*) AS totalCustomers FROM customers');
    const totalCustomers = custRows[0]?.totalCustomers || 0;

    // 2. Tot leads
    const [leadRows] = await pool.query('SELECT COUNT(*) AS totalLeads FROM leads');
    const totalLeads = leadRows[0]?.totalLeads || 0;

    // 3 convrtd leads
    const [convertedRows] = await pool.query("SELECT COUNT(*) AS convertedLeads FROM leads WHERE status = 'Converted'");
    const convertedLeads = convertedRows[0]?.convertedLeads || 0;

    // 4. total rev
    const [salesRows] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM sales');
    const totalRevenue = parseFloat(salesRows[0]?.totalRevenue || 0);

    // 5 conv rate calc (avoid div by 0)
    const conversionRate = totalLeads > 0 
      ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalLeads,
        convertedLeads,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        conversionRate
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate dashboard statistics',
      error: error.message
    });
  }
};

// get /api/dashbord/monthly-sales
// monthly rev grouped by month for line chrt
const getMonthlySales = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(sale_date, '%Y-%m') AS monthKey,
        DATE_FORMAT(sale_date, '%b %Y') AS month,
        ROUND(COALESCE(SUM(amount), 0), 2) AS revenue,
        COUNT(*) AS salesCount
      FROM sales
      WHERE sale_date IS NOT NULL
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m'), DATE_FORMAT(sale_date, '%b %Y')
      ORDER BY monthKey ASC
    `;

    const [rows] = await pool.query(query);

    const formattedData = rows.map(r => ({
      monthKey: r.monthKey,
      month: r.month,
      revenue: parseFloat(r.revenue || 0),
      salesCount: parseInt(r.salesCount || 0, 10)
    }));

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly sales analysis',
      error: error.message
    });
  }
};

//get/api/dashbrd/lead-analysis
// lead counts by status for pie chart
const getLeadAnalysis = async (req, res) => {
  try {
    const query = `
      SELECT 
        status, 
        COUNT(*) AS count 
      FROM leads 
      GROUP BY status
    `;

    const [rows] = await pool.query(query);

    // Keep all std statuses even when 0
    const standardStatuses = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
    const countMap = {};
    rows.forEach(r => {
      countMap[r.status] = parseInt(r.count, 10);
    });

    const data = standardStatuses.map(status => ({
      name: status,
      value: countMap[status] || 0
    }));

    // include any extra status from db
    rows.forEach(r => {
      if (!standardStatuses.includes(r.status)) {
        data.push({
          name: r.status,
          value: parseInt(r.count, 10)
        });
      }
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching lead analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead analysis',
      error: error.message
    });
  }
};

// get /api/dashbrd/customer-growth
// monthly costmr signups for growth chrt
const getCustomerGrowth = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS monthKey,
        DATE_FORMAT(created_at, '%b %Y') AS month,
        COUNT(*) AS count
      FROM customers
      WHERE created_at IS NOT NULL
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
      ORDER BY monthKey ASC
    `;

    const [rows] = await pool.query(query);

    let cumulativeTotal = 0;
    const formattedData = rows.map(r => {
      const count = parseInt(r.count, 10);
      cumulativeTotal += count;
      return {
        monthKey: r.monthKey,
        month: r.month,
        newCustomers: count,
        totalCumulative: cumulativeTotal
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching customer growth:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer growth data',
      error: error.message
    });
  }
};

// get /api/dashbord/recent-activity
// recent custs & leads for dashbrd overview
const getRecentActivity = async (req, res) => {
  try {
    const [recentCustomers] = await pool.query(
      'SELECT id, name, email, phone, company, status, created_at FROM customers ORDER BY created_at DESC LIMIT 5'
    );

    const [recentLeads] = await pool.query(
      'SELECT id, name, email, phone, source, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5'
    );

    return res.status(200).json({
      success: true,
      data: {
        recentCustomers,
        recentLeads
      }
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activities',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlySales,
  getLeadAnalysis,
  getCustomerGrowth,
  getRecentActivity
};
