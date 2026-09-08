const Joi = require('joi');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().trim().min(1)
);

const createRecommendationRequestSchema = Joi.object({
  farmId: idSchema,
  farm_id: idSchema,
  cropId: idSchema,
  crop_id: idSchema,
  diseaseAnalysisId: idSchema,
  disease_analysis_id: idSchema,
  language: Joi.string().valid('en', 'hi', 'pa', 'ta', 'te', 'bn').default('en')
})
.or('farmId', 'farm_id')
.or('cropId', 'crop_id')
.or('diseaseAnalysisId', 'disease_analysis_id');

const geminiRecommendationSchema = Joi.object({
  recommendations: Joi.array().items(Joi.string().trim()).min(1).required(),
  preventionSteps: Joi.array().items(Joi.string().trim()).min(1).required(),
  treatmentSuggestions: Joi.array().items(Joi.string().trim()).min(1).required(),
  timingSuggestions: Joi.array().items(Joi.string().trim()).min(1).required()
}).unknown();

const parseAndValidateRecommendationResponse = (rawText) => {
  let parsed;

  try {
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    parsed = JSON.parse(cleanText);
  } catch (error) {
    logger.error(`Failed to parse Gemini recommendation JSON output: ${error.message}`);
    throw ApiError.unprocessableEntity('Malformed AI recommendation response. Invalid JSON.', 'AI_RECOMMENDATION_ERROR');
  }

  const { value: validated, error } = geminiRecommendationSchema.validate(parsed, { abortEarly: false });

  if (error) {
    const details = error.details.map((d) => d.message).join(', ');
    logger.error(`Gemini recommendation response failed schema validation: ${details}`);
    throw ApiError.unprocessableEntity(`Malformed AI recommendation response: ${details}`, 'AI_RECOMMENDATION_ERROR');
  }

  return validated;
};

module.exports = {
  createRecommendationRequestSchema,
  geminiRecommendationSchema,
  parseAndValidateRecommendationResponse
};
