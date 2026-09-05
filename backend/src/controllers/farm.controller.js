const farmService = require('../services/farm.service');
const { sendSuccess } = require('../utils/apiResponse');

const createFarm = async (req, res, next) => {
  try {
    const farm = await farmService.createFarm(req.user.id, req.body);
    return sendSuccess(res, 201, 'Farm created successfully', farm);
  } catch (error) {
    next(error);
  }
};

const getFarmerFarms = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await farmService.getFarmerFarms(req.user.id, page, limit);
    return sendSuccess(res, 200, 'Farms retrieved successfully', {
      ...result,
      farms: result.items,
      totalPages: result.pagination?.totalPages || 1
    });
  } catch (error) {
    next(error);
  }
};

const getFarmById = async (req, res, next) => {
  try {
    const farm = await farmService.getFarmById(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Farm details retrieved successfully', farm);
  } catch (error) {
    next(error);
  }
};

const updateFarm = async (req, res, next) => {
  try {
    const farm = await farmService.updateFarm(req.user.id, req.params.farmId, req.body, req.user.role);
    return sendSuccess(res, 200, 'Farm updated successfully', farm);
  } catch (error) {
    next(error);
  }
};

const deleteFarm = async (req, res, next) => {
  try {
    await farmService.deleteFarm(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Farm deleted successfully', { farmId: req.params.farmId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFarm,
  getFarmerFarms,
  getFarmById,
  updateFarm,
  deleteFarm
};
