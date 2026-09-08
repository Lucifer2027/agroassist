const Joi = require('joi');

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().trim().min(1)
);

const analyticsFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  disease: Joi.string().trim().max(255),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical'),
  farmId: idSchema,
  cropName: Joi.string().trim().max(150)
});

module.exports = {
  analyticsFilterSchema
};
