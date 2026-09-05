const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../../config/cloudinary.config');
const { logger } = require('../../utils/logger');

// Configure Cloudinary v2 SDK
cloudinary.config(cloudinaryConfig);

/**
 * Cloudinary integration module placeholder for Phase 1 infrastructure
 */
const getCloudinaryInstance = () => cloudinary;

module.exports = {
  cloudinary,
  getCloudinaryInstance
};
