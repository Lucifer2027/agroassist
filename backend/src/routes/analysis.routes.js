const express = require('express');
const analysisController = require('../controllers/analysis.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { strictRateLimiter } = require('../middleware/security.middleware');
const { diseaseAnalysisRequestSchema, historyQuerySchema } = require('../validators/analysis.validator');

const router = express.Router() ;

// Require JWT authentication for all analysis endpoints
router.use(authenticate);

// Master 14-Step Disease Analysis Pipeline Endpoint (Rate Limited)
router.post('/', strictRateLimiter, validate(diseaseAnalysisRequestSchema), analysisController.executeCompleteAnalysis);

// Specific Disease Diagnosis Endpoint (Rate Limited)
router.post('/disease', strictRateLimiter, validate(diseaseAnalysisRequestSchema), analysisController.analyzeDisease);

// Query Farm Analysis History Endpoint with filtering & pagination
router.get('/history/:farmId', validate(historyQuerySchema, 'query'), analysisController.getFarmAnalysisHistory);

// Query Specific Analysis Details by ID
router.get('/:analysisId', analysisController.getAnalysisById);

module.exports = router;
