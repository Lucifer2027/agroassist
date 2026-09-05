const bcrypt = require('bcryptjs');
const { query } = require('./index');
const { logger } = require('../../utils/logger');

/**
 * Seeds local development database with sample Farmer, Farm, Crop, Scan, & Weather data
 */
const seedDatabase = async () => {
  logger.info('Starting local development MySQL database seeder...');

  try {
    // 1. Seed Sample Farmer User
    const passwordHash = await bcrypt.hash('FarmerPass123!', 10);

    const userSql = `
      INSERT INTO users (first_name, last_name, email, password_hash, phone, location, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE first_name=VALUES(first_name)
    `;
    const userRes = await query(userSql, [
      'Rajesh', 'Kumar', 'rajesh.kumar@example.com', passwordHash,
      '+919876543210', 'Punjab, India', 'farmer'
    ]);
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', ['rajesh.kumar@example.com']);
    const farmerId = existingUsers?.[0]?.id || userRes?.insertId;

    // 2. Seed Sample Farm
    const farmSql = `
      INSERT INTO farms (user_id, farm_name, location, latitude, longitude, area, area_unit, soil_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const farmRes = await query(farmSql, [
      farmerId, 'Green Acres Valley', 'Ludhiana, Punjab', 30.9010, 75.8573, 12.50, 'acres', 'Alluvial'
    ]);
    const farmId = farmRes?.insertId;

    // 3. Seed Sample Crop
    const cropSql = `
      INSERT INTO crops (farm_id, crop_name, crop_variety, sowing_date, expected_harvest_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await query(cropSql, [
      farmId, 'Tomato', 'Roma VF', '2026-06-01', '2026-09-30', 'growing'
    ]);

    logger.info('Local MySQL seed data successfully populated.');
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  seedDatabase
};
