const recommendationService = require('../services/recommendation.service');
const { sendSuccess } = require('../utils/apiResponse');

const generateRecommendations = async (req, res, next) => {
  try {
    const { farmId, cropId, diseaseAnalysisId, language } = req.body;
    const result = await recommendationService.generateRecommendations(
      req.user.id, farmId, cropId, diseaseAnalysisId, language, req.user.role
    );
    return sendSuccess(res, 200, 'Actionable agricultural recommendations generated successfully', result);
  } catch (error) {
    next(error);
  }
};

const getRecommendationsByAnalysisId = async (req, res, next) => {
  try {
    const recs = await recommendationService.getRecommendationsByAnalysisId(
      req.user.id, req.params.analysisId, req.user.role
    );
    return sendSuccess(res, 200, 'Recommendations retrieved successfully', recs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRecommendations,
  getRecommendationsByAnalysisId
};
