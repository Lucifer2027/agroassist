const cloudinaryService = require('../services/cloudinary.service');
const { sendSuccess } = require('../utils/apiResponse');

const generateUploadSignature = async (req, res, next) => {
  try {
    const { farmId, cropId } = req.body;
    const signatureData = await cloudinaryService.generateUploadSignature(req.user.id, farmId, cropId, req.user.role);
    return sendSuccess(res, 200, 'Cloudinary upload signature generated successfully', signatureData);
  } catch (error) {
    next(error);
  }
};

const registerAssetMetadata = async (req, res, next) => {
  try {
    const asset = await cloudinaryService.registerAssetMetadata(req.user.id, req.body, req.user.role);
    return sendSuccess(res, 201, 'Cloudinary asset metadata registered successfully', asset);
  } catch (error) {
    next(error);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await cloudinaryService.getAssetById(req.user.id, req.params.assetId, req.user.role);
    return sendSuccess(res, 200, 'Cloudinary asset metadata retrieved successfully', asset);
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const result = await cloudinaryService.deleteAsset(req.user.id, req.params.assetId, req.user.role);
    return sendSuccess(res, 200, 'Cloudinary asset deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateUploadSignature,
  registerAssetMetadata,
  getAssetById,
  deleteAsset
};
