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

    const sql = `
      INSERT INTO crop_risk_records (
        farm_id, crop_id, disease_analysis_id, risk_score, risk_level, risk_factors
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      farm_id, crop_id, disease_analysis_id, risk_score, risk_level, JSON.stringify(risk_factors)
    ];

    const result = await query(sql, params, conn);
    const riskId = result?.insertId || riskData?.id;
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
