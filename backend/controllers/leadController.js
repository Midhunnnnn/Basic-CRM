const { pool } = require('../config/db');

// Allowed lead statuses
const VALID_STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];

//get /api/leads - fetch lds w/ optional search & status
const getAllLeads = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // status filter
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    //search by name, email or src
    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR email LIKE ? OR source LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC, id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads from database',
      error: error.message
    });
  }
};

// get /api/leads/:id - fetch 1 lead
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lead with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error(`Error fetching lead ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead',
      error: error.message
    });
  }
};

//post /api/leads - create new lead
const createLead = async (req, res) => {
  try {
    const { name, email, phone, source, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Lead name is required'
      });
    }

    const leadStatus = status && VALID_STATUSES.includes(status) ? status : 'New';

    const [result] = await pool.query(
      'INSERT INTO leads (name, email, phone, source, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email ? email.trim() : null, phone ? phone.trim() : null, source ? source.trim() : null, leadStatus]
    );

    const [newLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLead[0]
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: error.message
    });
  }
};

// put /api/leads/:id - edit lead infrmtn
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, source, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lead with ID ${id} not found`
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Lead name is required'
      });
    }

    const leadStatus = status && VALID_STATUSES.includes(status) ? status : existing[0].status;

    await pool.query(
      'UPDATE leads SET name = ?, email = ?, phone = ?, source = ?, status = ? WHERE id = ?',
      [
        name.trim(),
        email !== undefined ? (email ? email.trim() : null) : existing[0].email,
        phone !== undefined ? (phone ? phone.trim() : null) : existing[0].phone,
        source !== undefined ? (source ? source.trim() : null) : existing[0].source,
        leadStatus,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error(`Error updating lead ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
};

// del /api/leads/:id - remove lead
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lead with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM leads WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error(`Error deleting lead ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      error: error.message
    });
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead
};
