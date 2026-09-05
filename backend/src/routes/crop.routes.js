const express = require('express');
const cropController = require('../controllers/crop.controller');
const analysisController = require('../controllers/analysis.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateCropSchema } = require('../validators/crop.validator');
const { historyQuerySchema } = require('../validators/analysis.validator');

const router = express.Router();

// Require authentication for all standalone crop routes
router.use(authenticate);

router.get('/:cropId', cropController.getCropById);
router.put('/:cropId', validate(updateCropSchema), cropController.updateCrop);
router.delete('/:cropId', cropController.deleteCrop);

// Query Crop Disease Analysis History Endpoint
router.get('/:cropId/analysis-history', validate(historyQuerySchema, 'query'), analysisController.getCropAnalysisHistory);

module.exports = router;
