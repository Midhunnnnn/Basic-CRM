const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

//load env vars from .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbName = process.env.DB_NAME;

// mysql2 promise conn pool
// handles multiple conns so we dont have to close manually
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4'
});

// Quick db ping test
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' Connected successfully to MySQL db:', dbName);
    connection.release();
    return true;
  } catch (error) {
    console.warn('!! MySQL Database Connection Warning:', error.message);
    console.warn('   Ensure MySQL Server is running on port ' + (process.env.DB_PORT || 3306) +
      ' and credentials in backend/.env are configured.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
