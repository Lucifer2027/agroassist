const express = require('express');
const adminAnalyticsController = require('../controllers/adminAnalytics.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { analyticsFilterSchema } = require('../validators/adminAnalytics.validator');

const router = express.Router();

// Require JWT authentication and role=admin for all admin analytics endpoints
router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/overview', adminAnalyticsController.getOverview);
router.get('/diseases', validate(analyticsFilterSchema, 'query'), adminAnalyticsController.getDiseasesAnalytics);
router.get('/risk', validate(analyticsFilterSchema, 'query'), adminAnalyticsController.getRiskAnalytics);
router.get('/weather', validate(analyticsFilterSchema, 'query'), adminAnalyticsController.getWeatherAnalytics);
router.get('/crops', validate(analyticsFilterSchema, 'query'), adminAnalyticsController.getCropsAnalytics);

module.exports = router;
