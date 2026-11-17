/**
 * Settings Controller - BASIC CRM
 * Handles system configuration and settings data persisted in MySQL.
 * General preferences are accessible for UI display, while system configuration
 * and mutations are strictly restricted to Super Admin role.
 */

const { pool } = require('../config/db');

// fix/normalize currency str
const normalizeCurrency = (val) => {
  if (!val) return 'INR (₹)';
  const str = String(val).toUpperCase();
  if (str.includes('INR') || str.includes('RUPEE') || str.includes('₹') || str.includes('?')) {
    return 'INR (₹)';
  }
  if (str.includes('EUR') || str.includes('EURO') || str.includes('€')) {
    return 'EUR (€)';
  }
  if (str.includes('GBP') || str.includes('POUND') || str.includes('£')) {
    return 'GBP (£)';
  }
  return 'USD ($)';
};

// make sure app_settings tbl exists w/ utf8mb4 + default row
const ensureSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT PRIMARY KEY DEFAULT 1,
        crm_name VARCHAR(100) DEFAULT 'BASIC CRM',
        currency VARCHAR(20) DEFAULT 'INR (₹)',
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        color_scheme VARCHAR(30) DEFAULT 'blue',
        date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // convert old tbl to utf8mb4 if needed
    await pool.query(`ALTER TABLE app_settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`).catch(() => {});

    const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO app_settings (id, crm_name, currency, timezone, color_scheme, date_format)
        VALUES (1, 'BASIC CRM', 'INR (₹)', 'Asia/Kolkata', 'blue', 'DD/MM/YYYY')
      `);
    }
  } catch (err) {
    console.warn('Warning in ensureSettingsTable:', err.message);
  }
};

/**
 * GET /api/settings/preferences
 * Public/authenticated general preferences (CRM name, currency, timezone, color scheme)
 */
const getPublicPreferences = async (req, res) => {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.query('SELECT crm_name, currency, timezone, color_scheme, date_format FROM app_settings WHERE id = 1');
    const settings = rows[0] || {
      crm_name: 'BASIC CRM',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata',
      color_scheme: 'blue',
      date_format: 'DD/MM/YYYY'
    };

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        crmName: settings.crm_name || 'BASIC CRM',
        currency: normalizeCurrency(settings.currency),
        timezone: settings.timezone || 'Asia/Kolkata',
        colorScheme: settings.color_scheme || 'blue',
        dateFormat: settings.date_format || 'DD/MM/YYYY'
      }
    });
  } catch (error) {
    console.error('Preferences Retrieval Error:', error.message);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        crmName: 'BASIC CRM',
        currency: 'INR (₹)',
        timezone: 'Asia/Kolkata',
        colorScheme: 'blue',
        dateFormat: 'DD/MM/YYYY'
      }
    });
  }
};

/**
 * GET /api/settings
 * Super Admin full system settings (including DB parameters)
 */
const getSettings = async (req, res) => {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    const settings = rows[0] || {
      crm_name: 'BASIC CRM',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata',
      color_scheme: 'blue',
      date_format: 'DD/MM/YYYY'
    };

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        crmName: settings.crm_name || 'BASIC CRM',
        dbName: process.env.DB_NAME,
        dbHost: process.env.DB_HOST || 'localhost',
        dbPort: parseInt(process.env.DB_PORT, 10) || 3306,
        currency: normalizeCurrency(settings.currency),
        timezone: settings.timezone || 'Asia/Kolkata',
        colorScheme: settings.color_scheme || 'blue',
        dateFormat: settings.date_format || 'DD/MM/YYYY',
        authorizedRole: 'Super Admin'
      }
    });
  } catch (error) {
    console.error('Settings Controller Error:', error.message);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message
    });
  }
};

/**
 * PUT /api/settings
 * Super Admin updates preferences and system configuration
 */
const updateSettings = async (req, res) => {
  try {
    await ensureSettingsTable();
    const { crmName, currency, timezone, colorScheme, dateFormat } = req.body;

    const finalCrmName = (crmName || 'BASIC CRM').trim();
    const finalCurrency = normalizeCurrency(currency);
    const finalTimezone = timezone || 'Asia/Kolkata';
    const finalColorScheme = colorScheme || 'blue';
    const finalDateFormat = dateFormat || 'DD/MM/YYYY';

    await pool.query(
      `UPDATE app_settings 
       SET crm_name = ?, currency = ?, timezone = ?, color_scheme = ?, date_format = ? 
       WHERE id = 1`,
      [finalCrmName, finalCurrency, finalTimezone, finalColorScheme, finalDateFormat]
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Settings updated successfully',
      data: {
        crmName: finalCrmName,
        currency: finalCurrency,
        timezone: finalTimezone,
        colorScheme: finalColorScheme,
        dateFormat: finalDateFormat
      }
    });
  } catch (error) {
    console.error('Settings Update Error:', error.message);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

module.exports = {
  getPublicPreferences,
  getSettings,
  updateSettings
};
