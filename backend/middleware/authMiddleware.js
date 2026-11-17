const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_electra_jwt_key_2026_secure';

// Verify jwt auth token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required. Please login.'
      });
    }

    // pull bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Format should be: Bearer <token>'
      });
    }

    const token = parts[1];

    // check token w/ secret
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // has id, email, name, role
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please login again.'
    });
  }
};

// check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Super Admin') {
    return res.status(403).json({
      statusCode: 403,
      success: false,
      error: 'Unauthorized',
      message: 'Access denied. Only Super Admin is authorized to access this resource.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireSuperAdmin
};
