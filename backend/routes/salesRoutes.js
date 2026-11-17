const express = require('express');
const router = express.Router();
const {
  getAllSales,
  createSale,
  deleteSale
} = require('../controllers/salesController');

//sales api routes
router.get('/', getAllSales);
router.post('/', createSale);
router.delete('/:id', deleteSale);

module.exports = router;
