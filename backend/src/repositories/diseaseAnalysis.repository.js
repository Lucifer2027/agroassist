const { query } = require('../database/mysql');

class DiseaseAnalysisRepository {
  formatRow(row) {
    if (!row) return null;
    return {
      ...row,
      symptoms: typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : row.symptoms,
      recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations,
      prevention_steps: typeof row.prevention_steps === 'string' ? JSON.parse(row.prevention_steps) : row.prevention_steps,
      treatment_suggestions: typeof row.treatment_suggestions === 'string' ? JSON.parse(row.treatment_suggestions) : row.treatment_suggestions,
      gemini_raw_response: typeof row.gemini_raw_response === 'string' ? JSON.parse(row.gemini_raw_response) : row.gemini_raw_response
    };
  }

  async create(analysisData, conn = null) {
    const {
      user_id,
      farm_id,
      crop_id,
      cloudinary_asset_id = null,
      disease_name,
      confidence_score,
      severity,
      environmental_risk_level,
      symptoms = [],
      recommendations = [],
      prevention_steps = [],
      treatment_suggestions = [],
      gemini_raw_response = {},
      analysis_status = 'completed'
    } = analysisData;

    const parseId = (val) => {
      if (val === null || val === undefined || val === 'null' || val === 'undefined') return null;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : null;
    };

    const safeUserId = parseId(user_id);
    const safeFarmId = parseId(farm_id);
    const safeCropId = parseId(crop_id);
    const safeAssetId = parseId(cloudinary_asset_id);

    let validSeverity = (severity || 'medium').toString().toLowerCase();
    if (!['low', 'medium', 'high'].includes(validSeverity)) {
      validSeverity = validSeverity === 'critical' ? 'high' : 'medium';
    }

    let validRisk = (environmental_risk_level || 'medium').toString().toLowerCase();
    if (!['low', 'medium', 'high'].includes(validRisk)) {
      validRisk = validRisk === 'critical' ? 'high' : 'medium';
    }

    const sql = `
      INSERT INTO disease_analyses (
        user_id, farm_id, crop_id, cloudinary_asset_id,
        disease_name, confidence_score, severity, environmental_risk_level,
        symptoms, recommendations, prevention_steps, treatment_suggestions,
        gemini_raw_response, analysis_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      safeUserId, safeFarmId, safeCropId, safeAssetId,
      disease_name, Number(confidence_score) || 90.0, validSeverity, validRisk,
      JSON.stringify(symptoms),
      JSON.stringify(recommendations),
      JSON.stringify(prevention_steps),
      JSON.stringify(treatment_suggestions),
      JSON.stringify(gemini_raw_response),
      analysis_status
    ];

    const result = await query(sql, params, conn);
    const analysisId = result?.insertId;
    return this.findById(analysisId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM disease_analyses WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? this.formatRow(rows[0]) : null;
  }

  async findByCropId(cropId, conn = null) {
    const sql = `SELECT * FROM disease_analyses WHERE crop_id = ? ORDER BY created_at DESC`;
    const rows = await query(sql, [cropId], conn);
    return rows.map((r) => this.formatRow(r));
  }

  async findByUserId(userId, conn = null) {
    const sql = `SELECT * FROM disease_analyses WHERE user_id = ? ORDER BY created_at DESC`;
    const rows = await query(sql, [userId], conn);
    return rows.map((r) => this.formatRow(r));
  }

  /**
   * Advanced Parameterized History Query Engine supporting pagination, sorting, and multi-field filters
   */
  async findHistoryPaginated({ farmId = null, cropId = null, disease = null, severity = null, riskLevel = null, startDate = null, endDate = null, sortBy = 'created_at', order = 'DESC', limit = 10, offset = 0 }, conn = null) {
    const conditions = [];
    const params = [];

    if (farmId) {
      conditions.push('da.farm_id = ?');
      params.push(farmId);
    }

    if (cropId) {
      conditions.push('da.crop_id = ?');
      params.push(cropId);
    }

    if (disease) {
      conditions.push('da.disease_name LIKE ?');
      params.push(`%${disease}%`);
    }

    if (severity) {
      conditions.push('da.severity = ?');
      params.push(severity);
    }

    if (riskLevel) {
      conditions.push('da.environmental_risk_level = ?');
      params.push(riskLevel);
    }

    if (startDate) {
      conditions.push('da.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('da.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortBy = ['created_at', 'confidence_score', 'severity', 'disease_name'].includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = (order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query Total Matching Count
    const countSql = `SELECT COUNT(*) AS total FROM disease_analyses da ${whereClause}`;
    const countRows = await query(countSql, params, conn);
    const totalItems = countRows.length ? Number(countRows[0].total) : 0;

    // Select Paginated & Joined History Items
    const selectSql = `
      SELECT 
        da.id AS analysisId,
        da.farm_id AS farmId,
        da.crop_id AS cropId,
        da.disease_name AS diseaseName,
        da.confidence_score AS confidence,
        da.severity,
        da.environmental_risk_level AS risk,
        da.recommendations AS recommendationSummary,
        da.created_at AS date,
        c.crop_name AS cropName,
        c.crop_variety AS cropVariety,
        ca.optimized_url AS optimizedUrl
      FROM disease_analyses da
      JOIN crops c ON da.crop_id = c.id
      LEFT JOIN cloudinary_assets ca ON da.cloudinary_asset_id = ca.id
      ${whereClause}
      ORDER BY da.${safeSortBy} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    const selectParams = [...params, Number(limit), Number(offset)];
    const rows = await query(selectSql, selectParams, conn);

    const items = rows.map((r) => ({
      id: r.analysisId,
      analysis_id: r.analysisId,
      analysisId: r.analysisId,
      farm_id: r.farmId,
      farmId: r.farmId,
      crop_id: r.cropId,
      cropId: r.cropId,
      crop_name: r.cropName,
      cropName: r.cropName,
      crop: {
        cropId: r.cropId,
        cropName: r.cropName,
        cropVariety: r.cropVariety
      },
      disease_name: r.diseaseName,
      diseaseName: r.diseaseName,
      diagnosis: r.diseaseName,
      disease: r.diseaseName,
      confidence_score: r.confidence,
      confidenceScore: r.confidence,
      confidence: r.confidence,
      severity: r.severity,
      environmental_risk_level: r.risk,
      risk_score: r.risk,
      risk: r.risk,
      image: r.optimizedUrl,
      created_at: r.date,
      createdAt: r.date,
      date: r.date,
      recommendationSummary: typeof r.recommendationSummary === 'string' ? JSON.parse(r.recommendationSummary) : r.recommendationSummary
    }));

    return {
      items,
      totalItems
    };
  }

  async update(id, updateFields, conn = null) {
    const allowed = [
      'disease_name', 'confidence_score', 'severity', 'environmental_risk_level',
      'symptoms', 'recommendations', 'prevention_steps', 'treatment_suggestions',
      'analysis_status'
    ];

    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateFields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) return this.findById(id, conn);

    params.push(id);
    const sql = `UPDATE disease_analyses SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params, conn);
    return this.findById(id, conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM disease_analyses WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new DiseaseAnalysisRepository();
