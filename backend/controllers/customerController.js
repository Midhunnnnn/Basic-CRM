const { pool } = require('../config/db');

// get /api/customers - fetch all custs w/ search & filter
const getAllCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    //filter by status if passed
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    // search name or mail
    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
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
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers from database',
      error: error.message
    });
  }
};

// GET /api/customers/:id - get one cstmr
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error(`Error fetching customer ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: error.message
    });
  }
};

// post /api/customers - add new costmr
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;

    //check req fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    const customerStatus = status || 'Active';

    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone, company, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email ? email.trim() : null, phone ? phone.trim() : null, company ? company.trim() : null, customerStatus]
    );

    // Grab newly inserted row
    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// PUT /api/customers/:id - edit customer info
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, status } = req.body;

    // Make sure cust exists
    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    await pool.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, company = ?, status = ? WHERE id = ?',
      [
        name.trim(),
        email !== undefined ? (email ? email.trim() : null) : existing[0].email,
        phone !== undefined ? (phone ? phone.trim() : null) : existing[0].phone,
        company !== undefined ? (company ? company.trim() : null) : existing[0].company,
        status || existing[0].status,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error(`Error updating customer ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// del /api/customers/:id - remove cstmr
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM customers WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error(`Error deleting customer ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
