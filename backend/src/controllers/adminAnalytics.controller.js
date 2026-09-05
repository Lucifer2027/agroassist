const adminAnalyticsService = require('../services/adminAnalytics.service');
const { sendSuccess } = require('../utils/apiResponse');

const getOverview = async (req, res, next) => {
  try {
    const overview = await adminAnalyticsService.getOverview();
    return sendSuccess(res, 200, 'Admin analytics overview retrieved successfully', overview);
  } catch (error) {
    next(error);
  }
};

const getDiseasesAnalytics = async (req, res, next) => {
  try {
    const result = await adminAnalyticsService.getDiseasesAnalytics(req.query);
    return sendSuccess(res, 200, 'Disease analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getRiskAnalytics = async (req, res, next) => {
  try {
    const result = await adminAnalyticsService.getRiskAnalytics(req.query);
    return sendSuccess(res, 200, 'Risk analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getWeatherAnalytics = async (req, res, next) => {
  try {
    const result = await adminAnalyticsService.getWeatherAnalytics(req.query);
    return sendSuccess(res, 200, 'Weather analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getCropsAnalytics = async (req, res, next) => {
  try {
    const result = await adminAnalyticsService.getCropsAnalytics(req.query);
    return sendSuccess(res, 200, 'Crop analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getDiseasesAnalytics,
  getRiskAnalytics,
  getWeatherAnalytics,
  getCropsAnalytics
};
