const { randomUUID } = require('crypto');
const farmService = require('./farm.service');
const cropService = require('./crop.service');
const cloudinaryService = require('./cloudinary.service');
const weatherService = require('./weather.service');
const riskService = require('./risk.service');
const recommendationService = require('./recommendation.service');
const snowflakeService = require('./snowflake.service');
const diseaseAnalysisRepository = require('../repositories/diseaseAnalysis.repository');
const recommendationRepository = require('../repositories/recommendation.repository');
const { analyzeLeafImageWithGemini } = require('../integrations/gemini/geminiClient');
const { parseAndValidateGeminiResponse } = require('../validators/analysis.validator');
const { withTransaction } = require('../database/mysql');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

class AnalysisService {
  /**
   * Master 14-Step Orchestrator connecting Cloudinary, Gemini, Weather, Risk Engine, MySQL, & Snowflake
   */
  async executeCompleteAnalysis(userId, farmId, cropId, cloudinaryAssetId, userRole = 'farmer') {
    const traceId = randomUUID();
    logger.info(`Starting Master 14-Step Disease Analysis Pipeline [TraceID: ${traceId}]`);

    // STEP 1-4: Authenticate & Validate Farm, Crop, and Cloudinary Asset Ownership
    const farm = await farmService.getFarmById(userId, farmId, userRole);
    const crop = await cropService.getCropById(userId, cropId, userRole);
    const asset = await cloudinaryService.getAssetById(userId, cloudinaryAssetId, userRole);

    // STEP 5: Retrieve 800x600 optimized Cloudinary URL
    const optimizedImageUrl = asset.optimized_url || asset.original_url;

    // STEP 6: Retrieve Crop & Farm context
    const cropContext = {
      crop_name: crop.crop_name,
      crop_variety: crop.crop_variety,
      location: farm.location
    };

    // STEP 7: Retrieve Current Weather (graceful fallback if API or coordinates unavailable)
    let weatherObservation = null;
    try {
      weatherObservation = await weatherService.getCurrentWeather(userId, farmId, userRole);
    } catch (weatherError) {
      logger.warn(`[TraceID: ${traceId}] Weather API observation unavailable: ${weatherError.message}`);
    }

    // STEP 8-9: Send Image to Gemini AI & Validate Response strictly
    const { rawResponse } = await analyzeLeafImageWithGemini(optimizedImageUrl, cropContext, asset.original_url);
    const validatedGemini = parseAndValidateGeminiResponse(rawResponse);

    // STEP 10: Calculate Agricultural Risk Score & Level
    const riskAssessment = await riskService.calculateCropRisk(userId, cropId, userRole);

    // STEP 11: Synthesize Actionable Recommendations via Gemini AI
    let recommendationResult = null;
    try {
      recommendationResult = await recommendationService.generateRecommendations(
        userId, farmId, cropId, asset.id, 'en', userRole
      );
    } catch (recErr) {
      logger.warn(`[TraceID: ${traceId}] Recommendation synthesis warning: ${recErr.message}`);
      recommendationResult = {
        recommendations: validatedGemini.recommendations || [],
        preventionSteps: validatedGemini.preventionSteps || [],
        treatmentSuggestions: validatedGemini.treatmentSuggestions || [],
        timingSuggestions: ['Follow local agricultural authority guidelines']
      };
    }

    // STEP 12: Store Complete Operational Analysis Atomically in MySQL
    let analysisRecord;
    try {
      analysisRecord = await withTransaction(async (conn) => {
        return diseaseAnalysisRepository.create({
          user_id: userId,
          farm_id: farmId,
          crop_id: cropId,
          cloudinary_asset_id: cloudinaryAssetId,
          disease_name: validatedGemini.diseaseName,
          confidence_score: validatedGemini.confidenceScore,
          severity: validatedGemini.severity,
          environmental_risk_level: validatedGemini.environmentalRiskLevel,
          symptoms: validatedGemini.symptoms,
          recommendations: validatedGemini.recommendations,
          prevention_steps: validatedGemini.preventionSteps,
          treatment_suggestions: validatedGemini.treatmentSuggestions,
          gemini_raw_response: { raw: rawResponse, traceId },
          analysis_status: 'completed'
        }, conn);
      });
    } catch (dbError) {
      logger.error(`[TraceID: ${traceId}] MySQL transaction failed: ${dbError.message}`);
      throw ApiError.internal(`Failed to persist operational analysis in database: ${dbError.message}`, 'DATABASE_TRANSACTION_FAILED');
    }

    // STEP 13: Asynchronously Synchronize Historical Data to Snowflake Data Warehouse
    try {
      snowflakeService.syncOperationalDataToSnowflake('DISEASE_ANALYSIS', analysisRecord);
    } catch (sfErr) {
      logger.warn(`[TraceID: ${traceId}] Background Snowflake sync logged as pending/failed: ${sfErr.message}`);
    }

    // STEP 14: Return Clean Traced Response
    return {
      traceId,
      analysisId: analysisRecord.id,
      analysis: {
        id: analysisRecord.id,
        diseaseName: validatedGemini.diseaseName,
        confidenceScore: validatedGemini.confidenceScore,
        severity: validatedGemini.severity,
        environmentalRiskLevel: validatedGemini.environmentalRiskLevel,
        symptoms: validatedGemini.symptoms,
        preventionSteps: validatedGemini.preventionSteps,
        treatmentSuggestions: validatedGemini.treatmentSuggestions,
        createdAt: analysisRecord.created_at
      },
      weather: weatherObservation ? {
        temperature: weatherObservation.temperature,
        humidity: weatherObservation.humidity,
        rainfall: weatherObservation.rainfall,
        windSpeed: weatherObservation.windSpeed,
        weatherCondition: weatherObservation.weatherCondition,
        rainProbability: weatherObservation.rainProbability
      } : null,
      risk: {
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        riskFactors: riskAssessment.riskFactors
      },
      recommendations: {
        items: recommendationResult.recommendations || validatedGemini.recommendations,
        preventionSteps: recommendationResult.preventionSteps || validatedGemini.preventionSteps,
        treatmentSuggestions: recommendationResult.treatmentSuggestions || validatedGemini.treatmentSuggestions,
        timingSuggestions: recommendationResult.timingSuggestions || []
      },
      image: {
        assetId: asset.id,
        publicId: asset.public_id,
        optimizedUrl: asset.optimized_url || asset.original_url
      }
    };
  }
}

module.exports = new AnalysisService();
