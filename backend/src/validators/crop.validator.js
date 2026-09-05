const Joi = require('joi');

const createCropSchema = Joi.object({
  crop_name: Joi.string().trim().min(2).max(150).required(),
  crop_variety: Joi.string().trim().max(150).allow(null, ''),
  sowing_date: Joi.date().iso().allow(null),
  expected_harvest_date: Joi.date().iso().min(Joi.ref('sowing_date')).allow(null).messages({
    'date.min': 'Expected harvest date must be on or after the sowing date'
  }),
  status: Joi.string().valid('active', 'harvested', 'fallow', 'failed').default('active')
});

const updateCropSchema = Joi.object({
  crop_name: Joi.string().trim().min(2).max(150),
  crop_variety: Joi.string().trim().max(150).allow(null, ''),
  sowing_date: Joi.date().iso().allow(null),
  expected_harvest_date: Joi.date().iso().min(Joi.ref('sowing_date')).allow(null).messages({
    'date.min': 'Expected harvest date must be on or after the sowing date'
  }),
  status: Joi.string().valid('active', 'harvested', 'fallow', 'failed')
}).min(1);

module.exports = {
  createCropSchema,
  updateCropSchema
};
