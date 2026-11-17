const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { pool, testConnection } = require('./config/db');

//load env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5009;

// Cors for react frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

// parse json/urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// quick req logger for dev
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { verifyToken } = require('./middleware/authMiddleware');

//health chk - pings api & mysql
app.get('/api/health', async (req, res) => {
  let databaseStatus = 'disconnected';

  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    databaseStatus = 'connected';
  } catch (error) {
    console.error('MySQL Health Check Error:', error.message);
    databaseStatus = 'disconnected';
  }

  res.status(200).json({
    status: databaseStatus === 'connected' ? 'ok' : 'degraded',
    message: 'BASIC CRM Backend API is up and running',
    database: databaseStatus,
    timestamp: new Date().toISOString()
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

//protected routes
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/leads', verifyToken, leadRoutes);
app.use('/api/sales', verifyToken, salesRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);

// root route
app.get('/', (req, res) => {
  res.send(`
    <h1>BASIC CRM Backend API</h1>
    <p>API is running on port ${PORT}.</p>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
      <li><a href="/api/customers">/api/customers</a></li>
      <li><a href="/api/leads">/api/leads</a></li>
      <li><a href="/api/sales">/api/sales</a></li>
      <li><a href="/api/dashboard/stats">/api/dashboard/stats</a></li>
    </ul>
  `);
});

// 404 catchall
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - endpoint not found`
  });
});

// global err handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// boot server + test db conn
app.listen(PORT, async () => {
  console.log(`server running on http://localhost:${PORT}`);
  await testConnection();
});
