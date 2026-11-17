const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_electra_jwt_key_2026_secure';

//post /api/auth/login
// auth super admin/admin/emp and send jwt back
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //1 check fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // 2. Find employe by email in db
    const query = `
      SELECT id, name, email, phone, department, designation, role, password, status
      FROM employees
      WHERE email = ?
    `;
    const [rows] = await pool.query(query, [email.trim().toLowerCase()]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const employee = rows[0];

    // 3 check if acc is active
    if (employee.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive. Please contact the Super Admin.'
      });
    }

    // 4. check pass hash w/ bcrypt
    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    //5 sign jwt token
    const tokenPayload = {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // 6 send usr data back (no pwd hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        role: employee.role,
        status: employee.status
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
};

// get /api/auth/me
// Returns logged in user info
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT id, name, email, phone, department, designation, role, status, created_at
      FROM employees
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getMe
};
