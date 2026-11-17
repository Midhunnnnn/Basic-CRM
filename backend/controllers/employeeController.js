const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// roles super admin can assign
const ALLOWED_ASSIGNABLE_ROLES = ['Admin', 'Employee'];

//get /api/employees
// fetch all emps (super admin only) - no pwd hashes
const getAllEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, name, email, phone, department, designation, role, status, created_at
      FROM employees
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (name LIKE ? OR email LIKE ? OR department LIKE ? OR designation LIKE ? OR role LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY created_at DESC, id DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: error.message
    });
  }
};

// post /api/employees
// add new employe (super admin only)
const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, department, designation, role, password } = req.body;

    // 1 check reqd fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee full name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long'
      });
    }

    // 2. role chk - super admin cant make another super admin
    if (role === 'Super Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create another Super Admin account. Only Admin or Employee roles are allowed.'
      });
    }

    const assignedRole = ALLOWED_ASSIGNABLE_ROLES.includes(role) ? role : 'Employee';
    const normalizedEmail = email.trim().toLowerCase();

    //3 see if email already taken
    const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `An employee with email '${normalizedEmail}' already exists`
      });
    }

    // 4 hash pwd w/ bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. save employee to db
    const insertQuery = `
      INSERT INTO employees (name, email, phone, department, designation, role, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `;

    const [result] = await pool.query(insertQuery, [
      name.trim(),
      normalizedEmail,
      phone ? phone.trim() : null,
      department ? department.trim() : null,
      designation ? designation.trim() : null,
      assignedRole,
      hashedPassword
    ]);

    // 6 get created row back (no pass)
    const [newEmployee] = await pool.query(
      `SELECT id, name, email, phone, department, designation, role, status, created_at
       FROM employees WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee[0]
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

//put /api/employees/:id
// edit emp details (super admin only)
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, designation, role, password, status } = req.body;

    // verify employe exists
    const [existingRows] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    const current = existingRows[0];

    // dont allow changing role or disabling super admin
    if (current.role === 'Super Admin' && role && role !== 'Super Admin') {
      return res.status(400).json({
        success: false,
        message: 'Super Admin role cannot be modified'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee name is required'
      });
    }

    // Check dup email if changed
    const normalizedEmail = email ? email.trim().toLowerCase() : current.email;
    if (normalizedEmail !== current.email) {
      const [emailCheck] = await pool.query('SELECT id FROM employees WHERE email = ? AND id != ?', [normalizedEmail, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Email '${normalizedEmail}' is already used by another employee`
        });
      }
    }

    //role update
    let targetRole = current.role;
    if (current.role !== 'Super Admin' && role) {
      targetRole = ALLOWED_ASSIGNABLE_ROLES.includes(role) ? role : current.role;
    }

    // only rehash pwd if new one sent
    let newPasswordHash = current.password;
    if (password && password.trim() !== '') {
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 4 characters long'
        });
      }
      newPasswordHash = await bcrypt.hash(password, 10);
    }

    const targetStatus = status || current.status;

    await pool.query(
      `UPDATE employees
       SET name = ?, email = ?, phone = ?, department = ?, designation = ?, role = ?, password = ?, status = ?
       WHERE id = ?`,
      [
        name.trim(),
        normalizedEmail,
        phone ? phone.trim() : null,
        department ? department.trim() : null,
        designation ? designation.trim() : null,
        targetRole,
        newPasswordHash,
        targetStatus,
        id
      ]
    );

    const [updated] = await pool.query(
      `SELECT id, name, email, phone, department, designation, role, status, created_at
       FROM employees WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error(`Error updating employee ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// del /api/employees/:id
// remove employee (super admin only)
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingRows] = await pool.query('SELECT id, name, role FROM employees WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    const employee = existingRows[0];

    // Block deleting super admin acc
    if (employee.role === 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account cannot be deleted'
      });
    }

    await pool.query('DELETE FROM employees WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Employee '${employee.name}' deleted successfully`,
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error(`Error deleting employee ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};

// patch /api/employees/:id/status
// toggle/set emp active status (super admin)
const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existingRows] = await pool.query('SELECT id, name, role, status FROM employees WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    const employee = existingRows[0];

    if (employee.role === 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account status cannot be changed'
      });
    }

    const newStatus = status ? status : (employee.status === 'Active' ? 'Inactive' : 'Active');

    await pool.query('UPDATE employees SET status = ? WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Employee '${employee.name}' status changed to ${newStatus}`,
      data: {
        id: employee.id,
        status: newStatus
      }
    });
  } catch (error) {
    console.error(`Error changing employee status ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee status',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
};
