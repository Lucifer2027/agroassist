const cropService = require('../services/crop.service');
const { sendSuccess } = require('../utils/apiResponse');

const createCrop = async (req, res, next) => {
  try {
    const crop = await cropService.createCrop(req.user.id, req.params.farmId, req.body, req.user.role);
    return sendSuccess(res, 201, 'Crop registered successfully', crop);
  } catch (error) {
    next(error);
  }
};

const getCropsByFarm = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await cropService.getCropsByFarm(req.user.id, req.params.farmId, page, limit, req.user.role);
    return sendSuccess(res, 200, 'Crops retrieved successfully', {
      ...result,
      crops: result.items,
      totalPages: result.pagination?.totalPages || 1
    });
  } catch (error) {
    next(error);
  }
};

const getCropById = async (req, res, next) => {
  try {
    const crop = await cropService.getCropById(req.user.id, req.params.cropId, req.user.role);
    return sendSuccess(res, 200, 'Crop details retrieved successfully', crop);
  } catch (error) {
    next(error);
  }
};

const updateCrop = async (req, res, next) => {
  try {
    const crop = await cropService.updateCrop(req.user.id, req.params.cropId, req.body, req.user.role);
    return sendSuccess(res, 200, 'Crop updated successfully', crop);
  } catch (error) {
    next(error);
  }
};

const deleteCrop = async (req, res, next) => {
  try {
    await cropService.deleteCrop(req.user.id, req.params.cropId, req.user.role);
    return sendSuccess(res, 200, 'Crop deleted successfully', { cropId: req.params.cropId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCrop,
  getCropsByFarm,
  getCropById,
  updateCrop,
  deleteCrop
};
