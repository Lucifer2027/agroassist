const riskService = require('../services/risk.service');
const { sendSuccess } = require('../utils/apiResponse');

const getCropRisk = async (req, res, next) => {
  try {
    const risk = await riskService.calculateCropRisk(req.user.id, req.params.cropId, req.user.role);
    return sendSuccess(res, 200, 'Crop agricultural risk calculated successfully', risk);
  } catch (error) {
    next(error);
  }
};

const getFarmRisk = async (req, res, next) => {
  try {
    const riskOverview = await riskService.getFarmRiskOverview(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Farm agricultural risk overview calculated successfully', riskOverview);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCropRisk,
  getFarmRisk
};
