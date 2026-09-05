const farmService = require('./farm.service');
const cropService = require('./crop.service');
const geminiService = require('./gemini.service');
const riskService = require('./risk.service');
const weatherRecordRepository = require('../repositories/weatherRecord.repository');
const recommendationRepository = require('../repositories/recommendation.repository');
const { generateActionableRecommendations } = require('../integrations/gemini/recommendationClient');
const { parseAndValidateRecommendationResponse } = require('../validators/recommendation.validator');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

class RecommendationService {
  /**
   * Generates actionable recommendations using trusted database context and Gemini AI
   */
  async generateRecommendations(userId, farmId, cropId, diseaseAnalysisId, language = 'en', userRole = 'farmer') {
    // 1. Verify ownership of farm, crop, and disease analysis using trusted database records
    const farm = await farmService.getFarmById(userId, farmId, userRole);
    const crop = await cropService.getCropById(userId, cropId, userRole);
    const analysis = await geminiService.getAnalysisById(userId, diseaseAnalysisId, userRole);

    // 2. Fetch latest weather and risk assessment from database
    const weatherRecords = await weatherRecordRepository.findByFarmId(farmId, 1);
    const latestWeather = weatherRecords.length ? weatherRecords[0] : null;

    const riskAssessment = await riskService.calculateCropRisk(userId, cropId, userRole);

    // 3. Assemble verified context from trusted database records (DO NOT trust user-supplied inputs)
    const verifiedContext = {
      crop_name: crop.crop_name,
      crop_variety: crop.crop_variety,
      location: farm.location,
      disease_name: analysis.disease_name,
      confidence_score: analysis.confidence_score,
      severity: analysis.severity,
      environmental_risk_level: analysis.environmental_risk_level,
      risk_score: riskAssessment.riskScore,
      risk_level: riskAssessment.riskLevel,
      temperature: latestWeather ? latestWeather.temperature : null,
      humidity: latestWeather ? latestWeather.humidity : null,
      rainfall: latestWeather ? latestWeather.rainfall : 0
    };

    // 4. Generate recommendations using Gemini AI
    const { rawResponse } = await generateActionableRecommendations(verifiedContext, language);

    // 5. Parse and strictly validate Gemini response
    const validated = parseAndValidateRecommendationResponse(rawResponse);

    // 6. Store each actionable recommendation in MySQL recommendations table
    const storedRecs = [];
    for (const recText of validated.recommendations) {
      const recRecord = await recommendationRepository.create({
        disease_analysis_id: diseaseAnalysisId,
        farm_id: farmId,
        crop_id: cropId,
        recommendation_type: 'action',
        recommendation_text: recText,
        priority: analysis.severity === 'high' ? 'high' : 'medium'
      });
      storedRecs.push(recRecord);
    }

    logger.info(`Stored ${storedRecs.length} actionable recommendations for Disease Analysis ${diseaseAnalysisId}`);

    return {
      diseaseAnalysisId,
      farmId,
      cropId,
      language,
      recommendations: validated.recommendations,
      preventionSteps: validated.preventionSteps,
      treatmentSuggestions: validated.treatmentSuggestions,
      timingSuggestions: validated.timingSuggestions,
      storedRecordCount: storedRecs.length
    };
  }

  /**
   * Retrieves stored recommendations for a disease analysis record from MySQL
   */
  async getRecommendationsByAnalysisId(userId, analysisId, userRole = 'farmer') {
    // Verify ownership of the disease analysis record
    await geminiService.getAnalysisById(userId, analysisId, userRole);
    return recommendationRepository.findByDiseaseAnalysisId(analysisId);
  }
}

module.exports = new RecommendationService();
