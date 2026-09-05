const { query } = require('../database/mysql');

const mapCropStatus = (status) => {
  if (!status) return 'growing';
  const s = String(status).toLowerCase();
  if (['planned', 'growing', 'harvested', 'completed'].includes(s)) return s;
  if (s === 'active') return 'growing';
  return 'planned';
};

class CropRepository {
  async create(cropData, conn = null) {
    const {
      farm_id,
      crop_name,
      crop_variety = null,
      sowing_date = null,
      expected_harvest_date = null,
      status = 'growing'
    } = cropData;

    const validStatus = mapCropStatus(status);

    const sql = `
      INSERT INTO crops (
        farm_id, crop_name, crop_variety, sowing_date, expected_harvest_date, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      farm_id, crop_name, crop_variety, sowing_date, expected_harvest_date, validStatus
    ];

    const result = await query(sql, params, conn);
    const cropId = result?.insertId || cropData?.id;
    return this.findById(cropId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM crops WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByFarmIdPaginated(farmId, limit = 10, offset = 0, conn = null) {
    const sql = `
      SELECT * FROM crops 
      WHERE farm_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return query(sql, [farmId, Number(limit), Number(offset)], conn);
  }

  async countByFarmId(farmId, conn = null) {
    const sql = `SELECT COUNT(*) AS total FROM crops WHERE farm_id = ?`;
    const rows = await query(sql, [farmId], conn);
    return rows.length ? Number(rows[0].total) : 0;
  }

  async findByFarmId(farmId, conn = null) {
    const sql = `SELECT * FROM crops WHERE farm_id = ? ORDER BY created_at DESC`;
    return query(sql, [farmId], conn);
  }

  async update(id, updateFields, conn = null) {
    const allowed = [
      'crop_name', 'crop_variety', 'sowing_date', 'expected_harvest_date', 'status'
    ];

    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateFields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return this.findById(id, conn);

    params.push(id);
    const sql = `UPDATE crops SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params, conn);
    return this.findById(id, conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM crops WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new CropRepository();
