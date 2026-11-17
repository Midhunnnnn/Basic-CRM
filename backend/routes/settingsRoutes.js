const express = require('express');
const router = express.Router();
const { getPublicPreferences, getSettings, updateSettings } = require('../controllers/settingsController');
const { verifyToken, requireSuperAdmin } = require('../middleware/authMiddleware');

// public prefs route (crm name, curr, tz, color scheme) for ui
router.get('/preferences', getPublicPreferences);

// rest of settings routes = super admin only
router.use(verifyToken);
router.use(requireSuperAdmin);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
