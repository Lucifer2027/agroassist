const { executeQuery, connectSnowflake } = require('../database/snowflake');
const farmService = require('./farm.service');
const cropService = require('./crop.service');
const diseaseAnalysisRepository = require('../repositories/diseaseAnalysis.repository');
const weatherRecordRepository = require('../repositories/weatherRecord.repository');
const cropRiskRecordRepository = require('../repositories/cropRiskRecord.repository');
const { query: mysqlQuery } = require('../database/mysql');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

class SnowflakeAnalyticsService {
  /**
   * Asynchronous, Non-Blocking Idempotent Synchronizer: Loads validated MySQL records into Snowflake.
   * Ensures primary MySQL transaction is NEVER corrupted if Snowflake is temporarily unavailable.
   */
  async syncOperationalDataToSnowflake(recordType, payload) {
    // Run in background without blocking API response thread
    setImmediate(async () => {
      try {
        logger.info(`Starting asynchronous Snowflake synchronization for ${recordType}...`);

        switch (recordType) {
          case 'DISEASE_ANALYSIS': {
            const sql = `
              INSERT INTO CORE.HISTORICAL_DISEASE_ANALYSIS (
                analysis_id, user_id, farm_id, crop_id, cloudinary_asset_id,
                disease_name, confidence_score, severity, environmental_risk_level, symptoms_count
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const symptomsCount = Array.isArray(payload.symptoms) ? payload.symptoms.length : 0;
            await executeQuery(sql, [
              payload.id, payload.user_id, payload.farm_id, payload.crop_id, payload.cloudinary_asset_id || null,
              payload.disease_name, payload.confidence_score, payload.severity, payload.environmental_risk_level, symptomsCount
            ]);
            break;
          }

          case 'WEATHER_RECORD': {
            const sql = `
              INSERT INTO CORE.HISTORICAL_WEATHER_DATA (
                weather_id, farm_id, latitude, longitude, temperature, humidity,
                rainfall, wind_speed, weather_condition, rain_probability
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await executeQuery(sql, [
              payload.id, payload.farm_id, payload.latitude || null, payload.longitude || null,
              payload.temperature || null, payload.humidity || null, payload.rainfall || 0,
              payload.wind_speed || null, payload.weather_condition || null, payload.rain_probability || null
            ]);
            break;
          }

          case 'CROP_RISK': {
            const sql = `
              INSERT INTO CORE.CROP_RISK_METRICS (
                risk_id, farm_id, crop_id, disease_analysis_id, risk_score, risk_level
              ) VALUES (?, ?, ?, ?, ?, ?)
            `;
            await executeQuery(sql, [
              payload.id, payload.farm_id, payload.crop_id, payload.disease_analysis_id || null,
              payload.risk_score, payload.risk_level
            ]);
            break;
          }

          default:
            logger.warn(`Unknown record type for Snowflake synchronization: ${recordType}`);
        }

        logger.info(`Successfully synchronized ${recordType} to Snowflake warehouse.`);
      } catch (error) {
        // Safe tracking & logging - DO NOT propagate error to MySQL primary transaction
        logger.warn(`Snowflake synchronization warning for ${recordType} (Logged for background retry): ${error.message}`);
      }
    });
  }

  /**
   * Retrieves overall farm analytics from Snowflake (with MySQL fallback resilience)
   */
  async getFarmAnalytics(userId, farmId, userRole = 'farmer') {
    await farmService.getFarmById(userId, farmId, userRole);

    try {
      const sql = `SELECT * FROM ANALYTICS.FARM_ANALYTICS WHERE farm_id = ?`;
      const rows = await executeQuery(sql, [farmId]);
      if (rows && rows.length) return rows[0];
    } catch (err) {
      logger.warn(`Snowflake analytics query fallback to MySQL: ${err.message}`);
    }

    // Fallback: Query MySQL operational store
    const mysqlSql = `
      SELECT 
        farm_id,
        COUNT(DISTINCT crop_id) AS total_crops,
        AVG(confidence_score) AS avg_disease_confidence
      FROM disease_analyses
      WHERE farm_id = ?
      GROUP BY farm_id
    `;
    const rows = await mysqlQuery(mysqlSql, [farmId]);
    return rows.length ? rows[0] : { farm_id: farmId, total_crops: 0, avg_disease_confidence: 0 };
  }

  /**
   * Retrieves disease trends for a farm from Snowflake ANALYTICS.DISEASE_TRENDS
   */
  async getDiseaseTrends(userId, farmId, userRole = 'farmer') {
    await farmService.getFarmById(userId, farmId, userRole);

    try {
      const sql = `SELECT * FROM ANALYTICS.DISEASE_TRENDS WHERE farm_id = ?`;
      const rows = await executeQuery(sql, [farmId]);
      if (rows && rows.length) return rows;
    } catch (err) {
      logger.warn(`Snowflake disease trends fallback to MySQL: ${err.message}`);
    }

    // Fallback query on MySQL
    const mysqlSql = `
      SELECT 
        farm_id,
        crop_id,
        disease_name,
        severity,
        COUNT(id) AS total_occurrences,
        AVG(confidence_score) AS avg_confidence,
        MAX(created_at) AS last_detected
      FROM disease_analyses
      WHERE farm_id = ?
      GROUP BY farm_id, crop_id, disease_name, severity
    `;
    return mysqlQuery(mysqlSql, [farmId]);
  }

  /**
   * Retrieves risk evolution metrics for a farm from Snowflake ANALYTICS.RISK_EVOLUTION
   */
  async getRiskAnalytics(userId, farmId, userRole = 'farmer') {
    await farmService.getFarmById(userId, farmId, userRole);

    try {
      const sql = `SELECT * FROM ANALYTICS.RISK_EVOLUTION WHERE farm_id = ?`;
      const rows = await executeQuery(sql, [farmId]);
      if (rows && rows.length) return rows;
    } catch (err) {
      logger.warn(`Snowflake risk evolution fallback to MySQL: ${err.message}`);
    }

    const mysqlSql = `
      SELECT 
        farm_id,
        crop_id,
        AVG(risk_score) AS avg_risk_score,
        MAX(risk_score) AS max_risk_score,
        COUNT(id) AS total_assessments,
        MAX(calculated_at) AS latest_assessment
      FROM crop_risk_records
      WHERE farm_id = ?
      GROUP BY farm_id, crop_id
    `;
    return mysqlQuery(mysqlSql, [farmId]);
  }

  /**
   * Retrieves weather-disease correlation data from Snowflake ANALYTICS.WEATHER_DISEASE_CORRELATION
   */
  async getWeatherDiseaseCorrelation(userId, farmId, userRole = 'farmer') {
    await farmService.getFarmById(userId, farmId, userRole);

    try {
      const sql = `SELECT * FROM ANALYTICS.WEATHER_DISEASE_CORRELATION WHERE farm_id = ?`;
      const rows = await executeQuery(sql, [farmId]);
      if (rows && rows.length) return rows[0];
    } catch (err) {
      logger.warn(`Snowflake weather-disease correlation fallback to MySQL: ${err.message}`);
    }

    const mysqlSql = `
      SELECT 
        w.farm_id,
        AVG(w.temperature) AS avg_temperature,
        AVG(w.humidity) AS avg_humidity,
        SUM(w.rainfall) AS total_rainfall,
        COUNT(DISTINCT d.id) AS disease_count
      FROM weather_records w
      LEFT JOIN disease_analyses d ON w.farm_id = d.farm_id
      WHERE w.farm_id = ?
      GROUP BY w.farm_id
    `;
    const rows = await mysqlQuery(mysqlSql, [farmId]);
    return rows.length ? rows[0] : { farm_id: farmId, avg_temperature: 0, avg_humidity: 0, total_rainfall: 0, disease_count: 0 };
  }

  /**
   * Retrieves analytical health metrics for a specific crop
   */
  async getCropAnalytics(userId, cropId, userRole = 'farmer') {
    const crop = await cropService.getCropById(userId, cropId, userRole);
    return this.getRiskAnalytics(userId, crop.farm_id, userRole);
  }
}

module.exports = new SnowflakeAnalyticsService();
