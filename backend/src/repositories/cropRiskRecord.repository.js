const { query } = require('../database/mysql');

class CropRiskRecordRepository {
  formatRow(row) {
    if (!row) return null;
    return {
      ...row,
      risk_factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors
    };
  }

  async create(riskData, conn = null) {
    const {
      farm_id,
      crop_id,
      disease_analysis_id = null,
      risk_score,
      risk_level,
      risk_factors = []
    } = riskData;

    const parseId = (val) => {
      if (val === null || val === undefined || val === 'null' || val === 'undefined') return null;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : null;
    };

    const safeFarmId = parseId(farm_id);
    const safeCropId = parseId(crop_id);
    const safeAnalysisId = parseId(disease_analysis_id);

    let validLevel = (risk_level || 'medium').toString().toLowerCase();
    if (!['low', 'medium', 'high', 'critical'].includes(validLevel)) {
      validLevel = 'medium';
    }

    const sql = `
      INSERT INTO crop_risk_records (
        farm_id, crop_id, disease_analysis_id, risk_score, risk_level, risk_factors
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      safeFarmId, safeCropId, safeAnalysisId, Number(risk_score) || 0, validLevel, JSON.stringify(risk_factors)
    ];

    const result = await query(sql, params, conn);
    const riskId = result?.insertId;
    return this.findById(riskId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM crop_risk_records WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? this.formatRow(rows[0]) : null;
  }

  async findByCropId(cropId, conn = null) {
    const sql = `SELECT * FROM crop_risk_records WHERE crop_id = ? ORDER BY calculated_at DESC`;
    const rows = await query(sql, [cropId], conn);
    return rows.map((r) => this.formatRow(r));
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM crop_risk_records WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new CropRiskRecordRepository();
