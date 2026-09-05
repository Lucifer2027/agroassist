const express = require('express');
const riskController = require('../controllers/risk.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Require JWT authentication for all risk assessment endpoints
router.use(authenticate);

router.get('/crop/:cropId', riskController.getCropRisk);
router.get('/farm/:farmId', riskController.getFarmRisk);

module.exports = router;
