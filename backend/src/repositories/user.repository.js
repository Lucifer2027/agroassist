const { query } = require('../database/mysql');

class UserRepository {
  async create(userData, conn = null) {
    const firstName = userData.first_name || userData.firstName || 'Farmer';
    const lastName = userData.last_name || userData.lastName || 'User';
    const email = userData.email;
    const passwordHash = userData.password_hash || userData.passwordHash || null;
    const phone = userData.phone || null;
    const location = userData.location || null;
    const profileImageUrl = userData.profile_image_url || userData.profileImageUrl || null;
    const googleId = userData.google_id || userData.googleId || null;
    const role = userData.role || 'farmer';
    const isActive = userData.is_active !== undefined ? (userData.is_active ? 1 : 0) : 1;

    let sql;
    let params;

    if (profileImageUrl || googleId) {
      sql = `
        INSERT INTO users (
          first_name, last_name, email, password_hash, phone,
          location, profile_image_url, google_id, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        firstName, lastName, email, passwordHash, phone,
        location, profileImageUrl, googleId, role, isActive
      ];
    } else {
      sql = `
        INSERT INTO users (
          first_name, last_name, email, password_hash, phone,
          location, role
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        firstName, lastName, email, passwordHash, phone,
        location, role
      ];
    }

    const result = await query(sql, params, conn);
    const userId = result?.insertId || userData?.id;
    return this.findById(userId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByEmail(email, conn = null) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const rows = await query(sql, [email], conn);
    return rows.length ? rows[0] : null;
  }

  async findByGoogleId(googleId, conn = null) {
    const sql = `SELECT * FROM users WHERE google_id = ?`;
    const rows = await query(sql, [googleId], conn);
    return rows.length ? rows[0] : null;
  }

  async update(id, updateFields, conn = null) {
    const allowed = [
      'first_name', 'last_name', 'phone', 'location',
      'profile_image_url', 'role', 'is_active', 'password_hash'
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
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params, conn);
    return this.findById(id, conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM users WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new UserRepository();
