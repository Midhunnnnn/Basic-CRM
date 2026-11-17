const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMonthlySales,
  getLeadAnalysis,
  getCustomerGrowth,
  getRecentActivity
} = require('../controllers/dashboardController');

//dashbrd analytics routes
router.get('/stats', getDashboardStats);
router.get('/monthly-sales', getMonthlySales);
router.get('/lead-analysis', getLeadAnalysis);
router.get('/customer-growth', getCustomerGrowth);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
