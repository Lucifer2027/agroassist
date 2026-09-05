const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const farmRoutes = require('./farm.routes');
const cropRoutes = require('./crop.routes');
const uploadRoutes = require('./upload.routes');
const analysisRoutes = require('./analysis.routes');
const weatherRoutes = require('./weather.routes');
const riskRoutes = require('./risk.routes');
const recommendationRoutes = require('./recommendation.routes');
const analyticsRoutes = require('./analytics.routes');
const reportRoutes = require('./report.routes');
const adminAnalyticsRoutes = require('./adminAnalytics.routes');

const router = express.Router();

// Mount API routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/farms', farmRoutes);
router.use('/crops', cropRoutes);
router.use('/uploads', uploadRoutes);
router.use('/analysis', analysisRoutes);
router.use('/weather', weatherRoutes);
router.use('/risk', riskRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);

module.exports = router;
