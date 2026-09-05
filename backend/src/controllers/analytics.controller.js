const snowflakeService = require('../services/snowflake.service');
const { sendSuccess } = require('../utils/apiResponse');

const getFarmAnalytics = async (req, res, next) => {
  try {
    const data = await snowflakeService.getFarmAnalytics(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Farm analytics retrieved successfully from data warehouse', data);
  } catch (error) {
    next(error);
  }
};

const getCropAnalytics = async (req, res, next) => {
  try {
    const data = await snowflakeService.getCropAnalytics(req.user.id, req.params.cropId, req.user.role);
    return sendSuccess(res, 200, 'Crop analytics retrieved successfully from data warehouse', data);
  } catch (error) {
    next(error);
  }
};

const getDiseaseTrends = async (req, res, next) => {
  try {
    const data = await snowflakeService.getDiseaseTrends(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Disease trends analytics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const getRiskAnalytics = async (req, res, next) => {
  try {
    const data = await snowflakeService.getRiskAnalytics(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Risk evolution analytics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const getWeatherCorrelation = async (req, res, next) => {
  try {
    const data = await snowflakeService.getWeatherDiseaseCorrelation(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Weather-disease correlation analytics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFarmAnalytics,
  getCropAnalytics,
  getDiseaseTrends,
  getRiskAnalytics,
  getWeatherCorrelation
};
