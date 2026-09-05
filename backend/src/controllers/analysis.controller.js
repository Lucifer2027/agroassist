const analysisService = require('../services/analysis.service');
const geminiService = require('../services/gemini.service');
const { sendSuccess } = require('../utils/apiResponse');

const executeCompleteAnalysis = async (req, res, next) => {
  try {
    const { farmId, cropId, cloudinaryAssetId } = req.body;
    const result = await analysisService.executeCompleteAnalysis(
      req.user.id, farmId, cropId, cloudinaryAssetId, req.user.role
    );
    return sendSuccess(res, 200, 'Complete agricultural disease analysis executed successfully', result);
  } catch (error) {
    next(error);
  }
};

const analyzeDisease = async (req, res, next) => {
  try {
    const { farmId, cropId, cloudinaryAssetId } = req.body;
    const result = await geminiService.analyzeCropDisease(
      req.user.id, farmId, cropId, cloudinaryAssetId, req.user.role
    );
    return sendSuccess(res, 200, 'Crop disease analysis completed successfully', result);
  } catch (error) {
    next(error);
  }
};

const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await geminiService.getAnalysisById(
      req.user.id, req.params.analysisId, req.user.role
    );
    return sendSuccess(res, 200, 'Disease analysis details retrieved successfully', analysis);
  } catch (error) {
    next(error);
  }
};

const getFarmAnalysisHistory = async (req, res, next) => {
  try {
    const result = await geminiService.getFarmAnalysisHistory(
      req.user.id, req.params.farmId, req.query, req.user.role
    );
    return sendSuccess(res, 200, 'Farm disease analysis history retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getCropAnalysisHistory = async (req, res, next) => {
  try {
    const result = await geminiService.getCropAnalysisHistory(
      req.user.id, req.params.cropId, req.query, req.user.role
    );
    return sendSuccess(res, 200, 'Crop disease analysis history retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  executeCompleteAnalysis,
  analyzeDisease,
  getAnalysisById,
  getFarmAnalysisHistory,
  getCropAnalysisHistory
};
