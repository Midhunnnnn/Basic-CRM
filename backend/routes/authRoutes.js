const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// public login route
router.post('/login', login);

//auth reqd - get current usr
router.get('/me', verifyToken, getMe);

module.exports = router;
