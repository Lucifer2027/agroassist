const express = require('express');
const weatherController = require('../controllers/weather.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Require JWT authentication for all weather endpoints
router.use(authenticate);

router.get('/current/:farmId', weatherController.getCurrentWeather);
router.get('/forecast/:farmId', weatherController.getForecastWeather);

module.exports = router;
