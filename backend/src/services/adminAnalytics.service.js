const { executeQuery } = require('../database/snowflake');
const { query: mysqlQuery } = require('../database/mysql');
const { logger } = require('../utils/logger');

class AdminAnalyticsService {
  /**
   * GET /api/admin/analytics/overview
   * Returns high-level system-wide metrics across farmers, farms, crops, analyses, confidence, and risk.
   */
  async getOverview() {
    try {
      const sfSql = `
        SELECT 
          (SELECT COUNT(DISTINCT user_id) FROM CORE.DIM_FARMER_FARM_CROP) AS TOTAL_FARMERS,
          (SELECT COUNT(DISTINCT farm_id) FROM CORE.DIM_FARMER_FARM_CROP) AS TOTAL_FARMS,
          (SELECT COUNT(DISTINCT crop_id) FROM CORE.DIM_FARMER_FARM_CROP) AS TOTAL_CROPS,
          (SELECT COUNT(analysis_id) FROM CORE.HISTORICAL_DISEASE_ANALYSIS) AS TOTAL_ANALYSES,
          (SELECT AVG(confidence_score) FROM CORE.HISTORICAL_DISEASE_ANALYSIS) AS AVG_CONFIDENCE,
          (SELECT AVG(risk_score) FROM CORE.CROP_RISK_METRICS) AS AVG_RISK
      `;
      const rows = await executeQuery(sfSql);
      if (rows && rows.length && (rows[0].TOTAL_ANALYSES > 0 || rows[0].TOTAL_FARMERS > 0)) {
        const r = rows[0];
        return {
          totalFarmers: Number(r.TOTAL_FARMERS || 0),
          totalFarms: Number(r.TOTAL_FARMS || 0),
          totalCrops: Number(r.TOTAL_CROPS || 0),
          totalAnalyses: Number(r.TOTAL_ANALYSES || 0),
          averageConfidence: parseFloat(Number(r.AVG_CONFIDENCE || 0).toFixed(2)),
          averageRiskScore: parseFloat(Number(r.AVG_RISK || 0).toFixed(2))
        };
      }
    } catch (err) {
      logger.warn(`Snowflake admin overview query fallback to MySQL: ${err.message}`);
    }

    // MySQL Fallback
    const mysqlSql = `
      SELECT 
        (SELECT COUNT(DISTINCT id) FROM users WHERE role = 'farmer') AS totalFarmers,
        (SELECT COUNT(DISTINCT id) FROM farms) AS totalFarms,
        (SELECT COUNT(DISTINCT id) FROM crops) AS totalCrops,
        (SELECT COUNT(id) FROM disease_analyses) AS totalAnalyses,
        (SELECT COALESCE(AVG(confidence_score), 0) FROM disease_analyses) AS averageConfidence,
        (SELECT COALESCE(AVG(risk_score), 0) FROM crop_risk_records) AS averageRiskScore
    `;
    const [row] = await mysqlQuery(mysqlSql);
    return {
      totalFarmers: Number(row?.totalFarmers || 0),
      totalFarms: Number(row?.totalFarms || 0),
      totalCrops: Number(row?.totalCrops || 0),
      totalAnalyses: Number(row?.totalAnalyses || 0),
      averageConfidence: parseFloat(Number(row?.averageConfidence || 0).toFixed(2)),
      averageRiskScore: parseFloat(Number(row?.averageRiskScore || 0).toFixed(2))
    };
  }

  /**
   * GET /api/admin/analytics/diseases
   * Returns disease frequency, average confidence, severity distribution, and disease trends with pagination.
   */
  async getDiseasesAnalytics(filters = {}) {
    const { startDate, endDate, disease, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    try {
      let sfWhere = 'WHERE 1=1';
      const sfBinds = [];

      if (disease) {
        sfWhere += ' AND LOWER(disease_name) LIKE ?';
        sfBinds.push(`%${disease.toLowerCase()}%`);
      }
      if (startDate) {
        sfWhere += ' AND analysis_timestamp >= ?';
        sfBinds.push(new Date(startDate).toISOString());
      }
      if (endDate) {
        sfWhere += ' AND analysis_timestamp <= ?';
        sfBinds.push(new Date(endDate).toISOString());
      }

      // Disease Frequency Query
      const sfFreqSql = `
        SELECT 
          disease_name AS "diseaseName",
          COUNT(analysis_id) AS "count",
          ROUND(AVG(confidence_score), 2) AS "avgConfidence"
        FROM CORE.HISTORICAL_DISEASE_ANALYSIS
        ${sfWhere}
        GROUP BY disease_name
        ORDER BY "count" DESC
      `;
      const freqRows = await executeQuery(sfFreqSql, sfBinds);

      // Severity Distribution Query
      const sfSevSql = `
        SELECT 
          severity,
          COUNT(analysis_id) AS "count"
        FROM CORE.HISTORICAL_DISEASE_ANALYSIS
        ${sfWhere}
        GROUP BY severity
      `;
      const sevRows = await executeQuery(sfSevSql, sfBinds);

      // System-wide Average Confidence
      const sfAvgConfSql = `
        SELECT ROUND(AVG(confidence_score), 2) AS "avgConfidence"
        FROM CORE.HISTORICAL_DISEASE_ANALYSIS
        ${sfWhere}
      `;
      const avgConfRows = await executeQuery(sfAvgConfSql, sfBinds);

      if (freqRows && (freqRows.length > 0 || sevRows.length > 0)) {
        const totalRecords = freqRows.length;
        const totalAnalyses = freqRows.reduce((sum, r) => sum + Number(r.count || r.COUNT || 0), 0);
        const paginatedFreq = freqRows.slice(offset, offset + limit).map(r => ({
          diseaseName: r.diseaseName || r.DISEASENAME,
          count: Number(r.count || r.COUNT || 0),
          avgConfidence: parseFloat(Number(r.avgConfidence || r.AVGCONFIDENCE || 0).toFixed(2)),
          percentage: totalAnalyses > 0 ? parseFloat(((Number(r.count || r.COUNT || 0) / totalAnalyses) * 100).toFixed(2)) : 0
        }));

        const severityDist = { low: 0, medium: 0, high: 0, critical: 0 };
        sevRows.forEach(r => {
          const sevKey = (r.severity || r.SEVERITY || '').toLowerCase();
          if (severityDist[sevKey] !== undefined) {
            severityDist[sevKey] = Number(r.count || r.COUNT || 0);
          }
        });

        return {
          diseaseFrequency: paginatedFreq,
          averageConfidence: parseFloat(Number(avgConfRows[0]?.avgConfidence || avgConfRows[0]?.AVGCONFIDENCE || 0).toFixed(2)),
          severityDistribution: severityDist,
          diseaseTrends: paginatedFreq,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit) || 1
          }
        };
      }
    } catch (err) {
      logger.warn(`Snowflake admin diseases query fallback to MySQL: ${err.message}`);
    }

    // MySQL Fallback
    let mysqlWhere = 'WHERE 1=1';
    const mysqlParams = [];

    if (disease) {
      mysqlWhere += ' AND LOWER(disease_name) LIKE ?';
      mysqlParams.push(`%${disease.toLowerCase()}%`);
    }
    if (startDate) {
      mysqlWhere += ' AND created_at >= ?';
      mysqlParams.push(new Date(startDate));
    }
    if (endDate) {
      mysqlWhere += ' AND created_at <= ?';
      mysqlParams.push(new Date(endDate));
    }

    // Total count for pagination
    const countSql = `SELECT COUNT(DISTINCT disease_name) AS totalRecords FROM disease_analyses ${mysqlWhere}`;
    const [countRow] = await mysqlQuery(countSql, mysqlParams);
    const totalRecords = Number(countRow?.totalRecords || 0);

    // Total analyses for percentage calculation
    const totalAnalysesSql = `SELECT COUNT(id) AS totalAnalyses, COALESCE(AVG(confidence_score), 0) AS avgConfidence FROM disease_analyses ${mysqlWhere}`;
    const [totRow] = await mysqlQuery(totalAnalysesSql, mysqlParams);
    const totalAnalyses = Number(totRow?.totalAnalyses || 0);
    const overallAvgConfidence = parseFloat(Number(totRow?.avgConfidence || 0).toFixed(2));

    // Paginated frequency query
    const freqSql = `
      SELECT 
        disease_name AS diseaseName,
        COUNT(id) AS count,
        ROUND(AVG(confidence_score), 2) AS avgConfidence,
        MAX(created_at) AS lastDetected
      FROM disease_analyses
      ${mysqlWhere}
      GROUP BY disease_name
      ORDER BY count DESC
      LIMIT ? OFFSET ?
    `;
    const freqRows = await mysqlQuery(freqSql, [...mysqlParams, Number(limit), Number(offset)]);
    const diseaseFrequency = freqRows.map(r => ({
      diseaseName: r.diseaseName,
      count: Number(r.count),
      avgConfidence: parseFloat(Number(r.avgConfidence).toFixed(2)),
      percentage: totalAnalyses > 0 ? parseFloat(((r.count / totalAnalyses) * 100).toFixed(2)) : 0,
      lastDetected: r.lastDetected
    }));

    // Severity distribution query
    const sevSql = `
      SELECT 
        severity,
        COUNT(id) AS count
      FROM disease_analyses
      ${mysqlWhere}
      GROUP BY severity
    `;
    const sevRows = await mysqlQuery(sevSql, mysqlParams);
    const severityDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    sevRows.forEach(r => {
      const k = (r.severity || '').toLowerCase();
      if (severityDistribution[k] !== undefined) {
        severityDistribution[k] = Number(r.count);
      }
    });

    return {
      diseaseFrequency,
      averageConfidence: overallAvgConfidence,
      severityDistribution,
      diseaseTrends: diseaseFrequency,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  /**
   * GET /api/admin/analytics/risk
   * Returns risk level distribution, average risk score, and risk trends with pagination.
   */
  async getRiskAnalytics(filters = {}) {
    const { riskLevel, startDate, endDate, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    try {
      let sfWhere = 'WHERE 1=1';
      const sfBinds = [];

      if (riskLevel) {
        sfWhere += ' AND LOWER(risk_level) = ?';
        sfBinds.push(riskLevel.toLowerCase());
      }
      if (startDate) {
        sfWhere += ' AND calculated_timestamp >= ?';
        sfBinds.push(new Date(startDate).toISOString());
      }
      if (endDate) {
        sfWhere += ' AND calculated_timestamp <= ?';
        sfBinds.push(new Date(endDate).toISOString());
      }

      // Risk Distribution Query
      const sfDistSql = `
        SELECT 
          risk_level AS "riskLevel",
          COUNT(risk_id) AS "count",
          ROUND(AVG(risk_score), 2) AS "avgRiskScore"
        FROM CORE.CROP_RISK_METRICS
        ${sfWhere}
        GROUP BY risk_level
      `;
      const distRows = await executeQuery(sfDistSql, sfBinds);

      // Average Risk Score Query
      const sfAvgRiskSql = `
        SELECT ROUND(AVG(risk_score), 2) AS "avgRiskScore"
        FROM CORE.CROP_RISK_METRICS
        ${sfWhere}
      `;
      const avgRows = await executeQuery(sfAvgRiskSql, sfBinds);

      // Risk Evolution / Trends per Farm & Crop
      const sfTrendsSql = `
        SELECT 
          farm_id AS "farmId",
          crop_id AS "cropId",
          ROUND(AVG(risk_score), 2) AS "avgRiskScore",
          MAX(risk_score) AS "maxRiskScore",
          COUNT(risk_id) AS "totalAssessments",
          MAX(calculated_timestamp) AS "latestAssessment"
        FROM CORE.CROP_RISK_METRICS
        ${sfWhere}
        GROUP BY farm_id, crop_id
        ORDER BY "avgRiskScore" DESC
      `;
      const trendRows = await executeQuery(sfTrendsSql, sfBinds);

      if (distRows && (distRows.length > 0 || trendRows.length > 0)) {
        const totalAssessments = distRows.reduce((sum, r) => sum + Number(r.count || r.COUNT || 0), 0);
        const riskDistribution = distRows.map(r => ({
          riskLevel: r.riskLevel || r.RISKLEVEL,
          count: Number(r.count || r.COUNT || 0),
          avgRiskScore: parseFloat(Number(r.avgRiskScore || r.AVGRISKSCORE || 0).toFixed(2)),
          percentage: totalAssessments > 0 ? parseFloat(((Number(r.count || r.COUNT || 0) / totalAssessments) * 100).toFixed(2)) : 0
        }));

        const totalRecords = trendRows.length;
        const paginatedTrends = trendRows.slice(offset, offset + limit).map(r => ({
          farmId: r.farmId || r.FARMID,
          cropId: r.cropId || r.CROPID,
          avgRiskScore: parseFloat(Number(r.avgRiskScore || r.AVGRISKSCORE || 0).toFixed(2)),
          maxRiskScore: parseFloat(Number(r.maxRiskScore || r.MAXRISKSCORE || 0).toFixed(2)),
          totalAssessments: Number(r.totalAssessments || r.TOTALASSESSMENTS || 0),
          latestAssessment: r.latestAssessment || r.LATESTASSESSMENT
        }));

        return {
          riskDistribution,
          averageRiskScore: parseFloat(Number(avgRows[0]?.avgRiskScore || avgRows[0]?.AVGRISKSCORE || 0).toFixed(2)),
          riskTrends: paginatedTrends,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit) || 1
          }
        };
      }
    } catch (err) {
      logger.warn(`Snowflake admin risk query fallback to MySQL: ${err.message}`);
    }

    // MySQL Fallback
    let mysqlWhere = 'WHERE 1=1';
    const mysqlParams = [];

    if (riskLevel) {
      mysqlWhere += ' AND LOWER(risk_level) = ?';
      mysqlParams.push(riskLevel.toLowerCase());
    }
    if (startDate) {
      mysqlWhere += ' AND calculated_at >= ?';
      mysqlParams.push(new Date(startDate));
    }
    if (endDate) {
      mysqlWhere += ' AND calculated_at <= ?';
      mysqlParams.push(new Date(endDate));
    }

    // Total assessments and average risk score
    const avgRiskSql = `SELECT COUNT(id) AS totalAssessments, COALESCE(AVG(risk_score), 0) AS avgRiskScore FROM crop_risk_records ${mysqlWhere}`;
    const [avgRow] = await mysqlQuery(avgRiskSql, mysqlParams);
    const totalAssessments = Number(avgRow?.totalAssessments || 0);
    const overallAvgRiskScore = parseFloat(Number(avgRow?.avgRiskScore || 0).toFixed(2));

    // Risk level distribution query
    const distSql = `
      SELECT 
        risk_level AS riskLevel,
        COUNT(id) AS count,
        ROUND(AVG(risk_score), 2) AS avgRiskScore
      FROM crop_risk_records
      ${mysqlWhere}
      GROUP BY risk_level
    `;
    const distRows = await mysqlQuery(distSql, mysqlParams);
    const riskDistribution = distRows.map(r => ({
      riskLevel: r.riskLevel,
      count: Number(r.count),
      avgRiskScore: parseFloat(Number(r.avgRiskScore).toFixed(2)),
      percentage: totalAssessments > 0 ? parseFloat(((r.count / totalAssessments) * 100).toFixed(2)) : 0
    }));

    // Risk trends pagination query
    const countTrendsSql = `SELECT COUNT(DISTINCT farm_id, crop_id) AS totalRecords FROM crop_risk_records ${mysqlWhere}`;
    const [countTrendRow] = await mysqlQuery(countTrendsSql, mysqlParams);
    const totalRecords = Number(countTrendRow?.totalRecords || 0);

    const trendsSql = `
      SELECT 
        farm_id AS farmId,
        crop_id AS cropId,
        ROUND(AVG(risk_score), 2) AS avgRiskScore,
        MAX(risk_score) AS maxRiskScore,
        COUNT(id) AS totalAssessments,
        MAX(calculated_at) AS latestAssessment
      FROM crop_risk_records
      ${mysqlWhere}
      GROUP BY farm_id, crop_id
      ORDER BY avgRiskScore DESC
      LIMIT ? OFFSET ?
    `;
    const trendRows = await mysqlQuery(trendsSql, [...mysqlParams, Number(limit), Number(offset)]);
    const riskTrends = trendRows.map(r => ({
      farmId: r.farmId,
      cropId: r.cropId,
      avgRiskScore: parseFloat(Number(r.avgRiskScore).toFixed(2)),
      maxRiskScore: parseFloat(Number(r.maxRiskScore).toFixed(2)),
      totalAssessments: Number(r.totalAssessments),
      latestAssessment: r.latestAssessment
    }));

    return {
      riskDistribution,
      averageRiskScore: overallAvgRiskScore,
      riskTrends,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  /**
   * GET /api/admin/analytics/weather
   * Returns weather summary metrics and weather-disease correlations per farm with pagination.
   */
  async getWeatherAnalytics(filters = {}) {
    const { farmId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    try {
      let sfWhere = 'WHERE 1=1';
      const sfBinds = [];

      if (farmId) {
        sfWhere += ' AND w.farm_id = ?';
        sfBinds.push(farmId);
      }

      // Weather Summary
      const sfSummarySql = `
        SELECT 
          ROUND(AVG(temperature), 2) AS "avgTemperature",
          ROUND(AVG(humidity), 2) AS "avgHumidity",
          ROUND(SUM(rainfall), 2) AS "totalRainfall",
          COUNT(weather_id) AS "totalObservations"
        FROM CORE.HISTORICAL_WEATHER_DATA w
        ${sfWhere}
      `;
      const sumRows = await executeQuery(sfSummarySql, sfBinds);

      // Weather Disease Correlations
      const sfCorrSql = `
        SELECT 
          w.farm_id AS "farmId",
          ROUND(AVG(w.temperature), 2) AS "avgTemperature",
          ROUND(AVG(w.humidity), 2) AS "avgHumidity",
          ROUND(SUM(w.rainfall), 2) AS "totalRainfall",
          COUNT(DISTINCT d.analysis_id) AS "diseaseCount"
        FROM CORE.HISTORICAL_WEATHER_DATA w
        LEFT JOIN CORE.HISTORICAL_DISEASE_ANALYSIS d ON w.farm_id = d.farm_id
        ${sfWhere}
        GROUP BY w.farm_id
        ORDER BY "diseaseCount" DESC
      `;
      const corrRows = await executeQuery(sfCorrSql, sfBinds);

      if (sumRows && (sumRows.length > 0 || corrRows.length > 0)) {
        const s = sumRows[0] || {};
        const weatherSummary = {
          avgTemperature: parseFloat(Number(s.avgTemperature || s.AVGTEMPERATURE || 0).toFixed(2)),
          avgHumidity: parseFloat(Number(s.avgHumidity || s.AVGHUMIDITY || 0).toFixed(2)),
          totalRainfall: parseFloat(Number(s.totalRainfall || s.TOTALRAINFALL || 0).toFixed(2)),
          totalObservations: Number(s.totalObservations || s.TOTALOBSERVATIONS || 0)
        };

        const totalRecords = corrRows.length;
        const weatherCorrelations = corrRows.slice(offset, offset + limit).map(r => ({
          farmId: r.farmId || r.FARMID,
          avgTemperature: parseFloat(Number(r.avgTemperature || r.AVGTEMPERATURE || 0).toFixed(2)),
          avgHumidity: parseFloat(Number(r.avgHumidity || r.AVGHUMIDITY || 0).toFixed(2)),
          totalRainfall: parseFloat(Number(r.totalRainfall || r.TOTALRAINFALL || 0).toFixed(2)),
          diseaseCount: Number(r.diseaseCount || r.DISEASECOUNT || 0)
        }));

        return {
          weatherSummary,
          weatherCorrelations,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit) || 1
          }
        };
      }
    } catch (err) {
      logger.warn(`Snowflake admin weather query fallback to MySQL: ${err.message}`);
    }

    // MySQL Fallback
    let mysqlWhere = 'WHERE 1=1';
    const mysqlParams = [];

    if (farmId) {
      mysqlWhere += ' AND w.farm_id = ?';
      mysqlParams.push(farmId);
    }

    const sumSql = `
      SELECT 
        COALESCE(AVG(w.temperature), 0) AS avgTemperature,
        COALESCE(AVG(w.humidity), 0) AS avgHumidity,
        COALESCE(SUM(w.rainfall), 0) AS totalRainfall,
        COUNT(w.id) AS totalObservations
      FROM weather_records w
      ${mysqlWhere}
    `;
    const [sumRow] = await mysqlQuery(sumSql, mysqlParams);
    const weatherSummary = {
      avgTemperature: parseFloat(Number(sumRow?.avgTemperature || 0).toFixed(2)),
      avgHumidity: parseFloat(Number(sumRow?.avgHumidity || 0).toFixed(2)),
      totalRainfall: parseFloat(Number(sumRow?.totalRainfall || 0).toFixed(2)),
      totalObservations: Number(sumRow?.totalObservations || 0)
    };

    const countCorrSql = `SELECT COUNT(DISTINCT w.farm_id) AS totalRecords FROM weather_records w ${mysqlWhere}`;
    const [countCorrRow] = await mysqlQuery(countCorrSql, mysqlParams);
    const totalRecords = Number(countCorrRow?.totalRecords || 0);

    const corrSql = `
      SELECT 
        w.farm_id AS farmId,
        ROUND(AVG(w.temperature), 2) AS avgTemperature,
        ROUND(AVG(w.humidity), 2) AS avgHumidity,
        ROUND(SUM(w.rainfall), 2) AS totalRainfall,
        COUNT(DISTINCT d.id) AS diseaseCount
      FROM weather_records w
      LEFT JOIN disease_analyses d ON w.farm_id = d.farm_id
      ${mysqlWhere}
      GROUP BY w.farm_id
      ORDER BY diseaseCount DESC
      LIMIT ? OFFSET ?
    `;
    const corrRows = await mysqlQuery(corrSql, [...mysqlParams, Number(limit), Number(offset)]);
    const weatherCorrelations = corrRows.map(r => ({
      farmId: r.farmId,
      avgTemperature: parseFloat(Number(r.avgTemperature || 0).toFixed(2)),
      avgHumidity: parseFloat(Number(r.avgHumidity || 0).toFixed(2)),
      totalRainfall: parseFloat(Number(r.totalRainfall || 0).toFixed(2)),
      diseaseCount: Number(r.diseaseCount || 0)
    }));

    return {
      weatherSummary,
      weatherCorrelations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  /**
   * GET /api/admin/analytics/crops
   * Returns disease trends per crop and total distinct crops analyzed with pagination.
   */
  async getCropsAnalytics(filters = {}) {
    const { cropName, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    try {
      let sfWhere = 'WHERE 1=1';
      const sfBinds = [];

      if (cropName) {
        sfWhere += ' AND LOWER(dim.crop_name) LIKE ?';
        sfBinds.push(`%${cropName.toLowerCase()}%`);
      }

      // Total Crops Analyzed Count
      const sfTotalCropsSql = `SELECT COUNT(DISTINCT crop_id) AS "totalCropsAnalyzed" FROM CORE.HISTORICAL_DISEASE_ANALYSIS`;
      const totRows = await executeQuery(sfTotalCropsSql);

      // Crop Disease Trends Query
      const sfTrendsSql = `
        SELECT 
          d.crop_id AS "cropId",
          d.disease_name AS "diseaseName",
          COUNT(d.analysis_id) AS "totalOccurrences",
          ROUND(AVG(d.confidence_score), 2) AS "avgConfidence",
          ROUND(AVG(r.risk_score), 2) AS "avgRiskScore"
        FROM CORE.HISTORICAL_DISEASE_ANALYSIS d
        LEFT JOIN CORE.CROP_RISK_METRICS r ON d.crop_id = r.crop_id
        LEFT JOIN CORE.DIM_FARMER_FARM_CROP dim ON d.crop_id = dim.crop_id
        ${sfWhere}
        GROUP BY d.crop_id, d.disease_name
        ORDER BY "totalOccurrences" DESC
      `;
      const trendRows = await executeQuery(sfTrendsSql, sfBinds);

      if (totRows && (totRows.length > 0 || trendRows.length > 0)) {
        const totalCropsAnalyzed = Number(totRows[0]?.totalCropsAnalyzed || totRows[0]?.TOTALCROPSANALYZED || 0);
        const totalRecords = trendRows.length;
        const cropDiseaseTrends = trendRows.slice(offset, offset + limit).map(r => ({
          cropId: r.cropId || r.CROPID,
          diseaseName: r.diseaseName || r.DISEASENAME,
          totalOccurrences: Number(r.totalOccurrences || r.TOTALOCCURRENCES || 0),
          avgConfidence: parseFloat(Number(r.avgConfidence || r.AVGCONFIDENCE || 0).toFixed(2)),
          avgRiskScore: parseFloat(Number(r.avgRiskScore || r.AVGRISKSCORE || 0).toFixed(2))
        }));

        return {
          totalCropsAnalyzed,
          cropDiseaseTrends,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit) || 1
          }
        };
      }
    } catch (err) {
      logger.warn(`Snowflake admin crops query fallback to MySQL: ${err.message}`);
    }

    // MySQL Fallback
    let mysqlWhere = 'WHERE 1=1';
    const mysqlParams = [];

    if (cropName) {
      mysqlWhere += ' AND LOWER(c.crop_name) LIKE ?';
      mysqlParams.push(`%${cropName.toLowerCase()}%`);
    }

    const countTotSql = `SELECT COUNT(DISTINCT crop_id) AS totalCropsAnalyzed FROM disease_analyses`;
    const [totRow] = await mysqlQuery(countTotSql);
    const totalCropsAnalyzed = Number(totRow?.totalCropsAnalyzed || 0);

    const countRecordsSql = `
      SELECT COUNT(DISTINCT d.crop_id, d.disease_name) AS totalRecords
      FROM disease_analyses d
      JOIN crops c ON d.crop_id = c.id
      ${mysqlWhere}
    `;
    const [countRecRow] = await mysqlQuery(countRecordsSql, mysqlParams);
    const totalRecords = Number(countRecRow?.totalRecords || 0);

    const trendsSql = `
      SELECT 
        d.crop_id AS cropId,
        c.crop_name AS cropName,
        d.disease_name AS diseaseName,
        COUNT(d.id) AS totalOccurrences,
        ROUND(AVG(d.confidence_score), 2) AS avgConfidence,
        ROUND(COALESCE(AVG(r.risk_score), 0), 2) AS avgRiskScore
      FROM disease_analyses d
      JOIN crops c ON d.crop_id = c.id
      LEFT JOIN crop_risk_records r ON d.crop_id = r.crop_id
      ${mysqlWhere}
      GROUP BY d.crop_id, c.crop_name, d.disease_name
      ORDER BY totalOccurrences DESC
      LIMIT ? OFFSET ?
    `;
    const trendRows = await mysqlQuery(trendsSql, [...mysqlParams, Number(limit), Number(offset)]);
    const cropDiseaseTrends = trendRows.map(r => ({
      cropId: r.cropId,
      cropName: r.cropName,
      diseaseName: r.diseaseName,
      totalOccurrences: Number(r.totalOccurrences),
      avgConfidence: parseFloat(Number(r.avgConfidence).toFixed(2)),
      avgRiskScore: parseFloat(Number(r.avgRiskScore).toFixed(2))
    }));

    return {
      totalCropsAnalyzed,
      cropDiseaseTrends,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }
}

module.exports = new AdminAnalyticsService();
