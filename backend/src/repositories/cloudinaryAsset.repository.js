const { query } = require('../database/mysql');

class CloudinaryAssetRepository {
  async create(assetData, conn = null) {
    const {
      user_id,
      farm_id = null,
      crop_id = null,
      public_id,
      resource_type = 'image',
      original_url,
      optimized_url,
      annotated_url = null,
      width = null,
      height = null,
      format = null
    } = assetData;

    const sql = `
      INSERT INTO cloudinary_assets (
        user_id, farm_id, crop_id, public_id, resource_type,
        original_url, optimized_url, annotated_url, width, height, format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      user_id, farm_id, crop_id, public_id, resource_type,
      original_url, optimized_url, annotated_url, width, height, format
    ];

    const result = await query(sql, params, conn);
    const assetId = result?.insertId;
    return this.findById(assetId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM cloudinary_assets WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByUserId(userId, conn = null) {
    const sql = `SELECT * FROM cloudinary_assets WHERE user_id = ? ORDER BY created_at DESC`;
    return query(sql, [userId], conn);
  }

  async findByPublicId(publicId, conn = null) {
    const sql = `SELECT * FROM cloudinary_assets WHERE public_id = ?`;
    const rows = await query(sql, [publicId], conn);
    return rows.length ? rows[0] : null;
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM cloudinary_assets WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new CloudinaryAssetRepository();
