const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Require JWT authentication for all data warehouse analytics endpoints
router.use(authenticate);

router.get('/farm/:farmId', analyticsController.getFarmAnalytics);
router.get('/crop/:cropId', analyticsController.getCropAnalytics);
router.get('/disease-trends/:farmId', analyticsController.getDiseaseTrends);
router.get('/risk/:farmId', analyticsController.getRiskAnalytics);
router.get('/weather-correlation/:farmId', analyticsController.getWeatherCorrelation);

module.exports = router;
