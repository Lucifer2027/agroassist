const Joi = require('joi');

const createFarmSchema = Joi.object({
  farm_name: Joi.string().trim().min(2).max(150).required(),
  location: Joi.string().trim().max(255).allow(null, ''),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  area: Joi.number().positive().allow(null),
  area_unit: Joi.string().valid('acres', 'hectares', 'sq_meters').default('acres'),
  soil_type: Joi.string().trim().max(100).allow(null, '')
});

const updateFarmSchema = Joi.object({
  farm_name: Joi.string().trim().min(2).max(150),
  location: Joi.string().trim().max(255).allow(null, ''),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  area: Joi.number().positive().allow(null),
  area_unit: Joi.string().valid('acres', 'hectares', 'sq_meters'),
  soil_type: Joi.string().trim().max(100).allow(null, '')
}).min(1);

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  createFarmSchema,
  updateFarmSchema,
  paginationQuerySchema
};
