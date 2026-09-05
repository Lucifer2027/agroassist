const express = require('express');
const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createRecommendationRequestSchema } = require('../validators/recommendation.validator');

const router = express.Router();

// Require JWT authentication for all recommendation endpoints
router.use(authenticate);

router.post('/', validate(createRecommendationRequestSchema), recommendationController.generateRecommendations);
router.get('/:analysisId', recommendationController.getRecommendationsByAnalysisId);

module.exports = router;
