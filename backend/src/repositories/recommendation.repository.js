const { query } = require('../database/mysql');

class RecommendationRepository {
  async create(recommendationData, conn = null) {
    const {
      disease_analysis_id,
      farm_id,
      crop_id,
      recommendation_type = 'action',
      recommendation_text,
      priority = 'medium'
    } = recommendationData;

    const parseId = (val) => {
      if (val === null || val === undefined || val === 'null' || val === 'undefined') return null;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : null;
    };

    const safeAnalysisId = parseId(disease_analysis_id);
    const safeFarmId = parseId(farm_id);
    const safeCropId = parseId(crop_id);

    let validPriority = (priority || 'medium').toString().toLowerCase();
    if (!['low', 'medium', 'high', 'urgent'].includes(validPriority)) {
      validPriority = 'medium';
    }

    const sql = `
      INSERT INTO recommendations (
        disease_analysis_id, farm_id, crop_id, recommendation_type, recommendation_text, priority
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      safeAnalysisId, safeFarmId, safeCropId, recommendation_type, recommendation_text, validPriority
    ];

    const result = await query(sql, params, conn);
    const recId = result?.insertId;
    return this.findById(recId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM recommendations WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByDiseaseAnalysisId(analysisId, conn = null) {
    const sql = `SELECT * FROM recommendations WHERE disease_analysis_id = ? ORDER BY created_at ASC`;
    return query(sql, [analysisId], conn);
  }

  async findByCropId(cropId, conn = null) {
    const sql = `SELECT * FROM recommendations WHERE crop_id = ? ORDER BY created_at DESC`;
    return query(sql, [cropId], conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM recommendations WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new RecommendationRepository();
