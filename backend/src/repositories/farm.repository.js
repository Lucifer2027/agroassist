const { query } = require('../database/mysql');

class FarmRepository {
  async create(farmData, conn = null) {
    const {
      user_id,
      farm_name,
      location = null,
      latitude = null,
      longitude = null,
      area = null,
      area_unit = 'acres',
      soil_type = null
    } = farmData;

    const sql = `
      INSERT INTO farms (
        user_id, farm_name, location, latitude, longitude, area, area_unit, soil_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      user_id, farm_name, location, latitude, longitude, area, area_unit, soil_type
    ];

    const result = await query(sql, params, conn);
    const farmId = result?.insertId || farmData?.id;
    return this.findById(farmId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM farms WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByUserIdPaginated(userId, limit = 10, offset = 0, conn = null) {
    const sql = `
      SELECT * FROM farms 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return query(sql, [userId, Number(limit), Number(offset)], conn);
  }

  async countByUserId(userId, conn = null) {
    const sql = `SELECT COUNT(*) AS total FROM farms WHERE user_id = ?`;
    const rows = await query(sql, [userId], conn);
    return rows.length ? Number(rows[0].total) : 0;
  }

  async findByUserId(userId, conn = null) {
    const sql = `SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC`;
    return query(sql, [userId], conn);
  }

  async update(id, updateFields, conn = null) {
    const allowed = [
      'farm_name', 'location', 'latitude', 'longitude', 'area', 'area_unit', 'soil_type'
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
    const sql = `UPDATE farms SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params, conn);
    return this.findById(id, conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM farms WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new FarmRepository();
