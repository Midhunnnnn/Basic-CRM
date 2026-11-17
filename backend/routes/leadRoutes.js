const express = require('express');
const router = express.Router();
const {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead
} = require('../controllers/leadController');

// lead endpoints
router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
