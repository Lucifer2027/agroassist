const Joi = require('joi');

const signatureRequestSchema = Joi.object({
  farmId: Joi.string().uuid().required(),
  cropId: Joi.string().uuid().required()
});

const registerMetadataSchema = Joi.object({
  farm_id: Joi.string().uuid().required(),
  crop_id: Joi.string().uuid().required(),
  public_id: Joi.string().trim().required(),
  original_url: Joi.string().uri().required(),
  resource_type: Joi.string().valid('image', 'raw', 'video').default('image'),
  width: Joi.number().integer().positive().allow(null),
  height: Joi.number().integer().positive().allow(null),
  format: Joi.string().valid('jpg', 'jpeg', 'png', 'webp').default('jpg')
});

module.exports = {
  signatureRequestSchema,
  registerMetadataSchema
};
