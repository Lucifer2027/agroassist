const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { strictRateLimiter } = require('../middleware/security.middleware');

const router = express.Router();

// Require JWT authentication for all PDF report generation endpoints
router.use(authenticate);

router.get('/analysis/:analysisId/pdf', strictRateLimiter, reportController.downloadAnalysisPdfReport);

module.exports = router;
