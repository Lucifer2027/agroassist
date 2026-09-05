const cropService = require('./crop.service');
const farmService = require('./farm.service');
const weatherService = require('./weather.service');
const diseaseAnalysisRepository = require('../repositories/diseaseAnalysis.repository');
const cropRiskRecordRepository = require('../repositories/cropRiskRecord.repository');
const cropRepository = require('../repositories/crop.repository');
const snowflakeService = require('./snowflake.service');
const riskEngine = require('./risk/riskEngine.service');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

class RiskService {
  /**
   * Calculates and persists agricultural risk for a specific crop
   */
  async calculateCropRisk(userId, cropId, userRole = 'farmer') {
    // 1. Verify ownership of crop and parent farm
    const crop = await cropService.getCropById(userId, cropId, userRole);

    // 2. Fetch latest disease analysis for this crop (if any)
    const analyses = await diseaseAnalysisRepository.findByCropId(cropId);
    const latestAnalysis = analyses.length ? analyses[0] : null;

    // 3. Fetch current weather observation for the parent farm (graceful fallback if missing/failed)
    let latestWeather = null;
    try {
      latestWeather = await weatherService.getCurrentWeather(userId, crop.farm_id, userRole);
    } catch (weatherErr) {
      logger.warn(`Weather data unavailable for risk calculation on Farm ${crop.farm_id}: ${weatherErr.message}`);
    }

    // 4. Run deterministic risk calculation engine
    const { riskScore, riskLevel, riskFactors } = riskEngine.calculateRisk(latestAnalysis, latestWeather, crop);

    // 5. Store risk record in MySQL transactional database
    const savedRecord = await cropRiskRecordRepository.create({
      farm_id: crop.farm_id,
      crop_id: cropId,
      disease_analysis_id: latestAnalysis ? latestAnalysis.id : null,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors
    });

    // Trigger non-blocking Snowflake analytics synchronization
    snowflakeService.syncOperationalDataToSnowflake('CROP_RISK', savedRecord);

    return {
      id: savedRecord.id,
      farmId: savedRecord.farm_id,
      cropId: savedRecord.crop_id,
      cropName: crop.crop_name,
      diseaseAnalysisId: savedRecord.disease_analysis_id,
      riskScore: savedRecord.risk_score,
      riskLevel: savedRecord.risk_level,
      riskFactors: savedRecord.risk_factors,
      calculatedAt: savedRecord.calculated_at
    };
  }

  /**
   * Retrieves overall risk overview for all crops in a farm
   */
  async getFarmRiskOverview(userId, farmId, userRole = 'farmer') {
    const farm = await farmService.getFarmById(userId, farmId, userRole);
    const crops = await cropRepository.findByFarmId(farmId);

    if (crops.length === 0) {
      return {
        farmId,
        farmName: farm.farm_name,
        averageRiskScore: 0,
        overallRiskLevel: 'low',
        cropsCount: 0,
        cropRisks: []
      };
    }

    const cropRisks = [];
    let totalScore = 0;

    for (const crop of crops) {
      const riskResult = await this.calculateCropRisk(userId, crop.id, userRole);
      cropRisks.push(riskResult);
      totalScore += Number(riskResult.riskScore);
    }

    const averageRiskScore = Math.round(totalScore / crops.length);
    let overallRiskLevel = 'low';
    if (averageRiskScore >= 85) overallRiskLevel = 'critical';
    else if (averageRiskScore >= 65) overallRiskLevel = 'high';
    else if (averageRiskScore >= 35) overallRiskLevel = 'medium';

    return {
      farmId,
      farmName: farm.farm_name,
      averageRiskScore,
      overallRiskLevel,
      cropsCount: crops.length,
      cropRisks
    };
  }
}

module.exports = new RiskService();
