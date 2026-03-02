const express = require('express');
const router = express.Router();
const closingController = require('../controllers/closingController');

router.post('/', closingController.performClosing);
router.get('/history', closingController.getClosingHistory);
router.get('/monthly', closingController.getMonthlyData);
router.get('/kpis', closingController.getKPIs);

module.exports = router;