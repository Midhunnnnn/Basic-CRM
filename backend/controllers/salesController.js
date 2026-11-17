const { pool } = require('../config/db');

//get /api/sales - all sales w/ cust info
const getAllSales = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.customer_id,
        s.amount,
        DATE_FORMAT(s.sale_date, '%Y-%m-%d') AS sale_date,
        s.created_at,
        COALESCE(c.name, 'Unknown Customer') AS customer_name,
        c.email AS customer_email,
        c.company AS customer_company
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.sale_date DESC, s.id DESC
    `;

    const [rows] = await pool.query(query);

    // Calclate tot rev from all sales
    const totalRevenue = rows.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    return res.status(200).json({
      success: true,
      count: rows.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sales records',
      error: error.message
    });
  }
};

// post /api/sales - log new sale
const createSale = async (req, res) => {
  try {
    const { customer_id, amount, sale_date } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer selection is required'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive sale amount is required'
      });
    }

    //chk cstmr exists in db
    const [customer] = await pool.query('SELECT id, name FROM customers WHERE id = ?', [customer_id]);
    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${customer_id} does not exist`
      });
    }

    const formattedDate = sale_date ? sale_date : new Date().toISOString().split('T')[0];

    const [result] = await pool.query(
      'INSERT INTO sales (customer_id, amount, sale_date) VALUES (?, ?, ?)',
      [customer_id, parsedAmount, formattedDate]
    );

    const [newSale] = await pool.query(
      `SELECT 
        s.id, 
        s.customer_id, 
        s.amount, 
        DATE_FORMAT(s.sale_date, '%Y-%m-%d') AS sale_date, 
        s.created_at, 
        c.name AS customer_name 
      FROM sales s 
      JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Sale record created successfully',
      data: newSale[0]
    });
  } catch (error) {
    console.error('Error creating sale record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create sale record',
      error: error.message
    });
  }
};

// del /api/sales/:id - remove sale rec
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sale record with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM sales WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Sale record deleted successfully',
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error(`Error deleting sale ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete sale record',
      error: error.message
    });
  }
};

module.exports = {
  getAllSales,
  createSale,
  deleteSale
};
