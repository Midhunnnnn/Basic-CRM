const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
} = require('../controllers/employeeController');
const { verifyToken, requireSuperAdmin } = require('../middleware/authMiddleware');

// emp routes need valid jwt + super admin
router.use(verifyToken);
router.use(requireSuperAdmin);

router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.patch('/:id/status', updateEmployeeStatus);

module.exports = router;
