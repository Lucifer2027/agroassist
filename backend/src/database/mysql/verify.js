const mysql = require('mysql2/promise');
const mysqlConfig = require('../../config/mysql.config');
const { logger } = require('../../utils/logger');

/**
 * Structural verification tool for MySQL Database
 */
const verifyMySQL = async () => {
  logger.info('Starting MySQL Structural Verification...');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });

    // 1. Verify Database Exists
    const [databases] = await connection.query(`SHOW DATABASES LIKE '${mysqlConfig.database}'`);
    if (databases.length === 0) {
      throw new Error(`Database '${mysqlConfig.database}' does not exist.`);
    }

    await connection.query(`USE \`${mysqlConfig.database}\`;`);

    // 2. Verify Required Tables
    const requiredTables = [
      'users',
      'farms',
      'crops',
      'cloudinary_assets',
      'disease_analyses',
      'weather_records',
      'crop_risk_records',
      'recommendations',
      'schema_migrations'
    ];

    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0]);

    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' is missing from database '${mysqlConfig.database}'.`);
      }
    }

    // 3. Verify users.id Column Type
    const [userColumns] = await connection.query("DESCRIBE users");
    const idColumn = userColumns.find((col) => col.Field === 'id');
    if (!idColumn) {
      throw new Error("Column 'id' is missing from 'users' table.");
    }

    const typeLower = idColumn.Type.toLowerCase();
    if (!typeLower.includes('bigint')) {
      throw new Error(`users.id must be BIGINT, found '${idColumn.Type}'.`);
    }
    if (idColumn.Extra.toLowerCase().indexOf('auto_increment') === -1) {
      throw new Error(`users.id must be AUTO_INCREMENT, found Extra='${idColumn.Extra}'.`);
    }

    // 4. Verify Critical Foreign Keys and Column Types
    const fkChecks = [
      { table: 'farms', column: 'user_id' },
      { table: 'crops', column: 'farm_id' },
      { table: 'cloudinary_assets', column: 'user_id' },
      { table: 'disease_analyses', column: 'user_id' },
      { table: 'disease_analyses', column: 'farm_id' },
      { table: 'disease_analyses', column: 'crop_id' },
      { table: 'weather_records', column: 'farm_id' },
      { table: 'crop_risk_records', column: 'farm_id' },
      { table: 'recommendations', column: 'disease_analysis_id' }
    ];

    for (const check of fkChecks) {
      const [cols] = await connection.query(`DESCRIBE \`${check.table}\``);
      const col = cols.find((c) => c.Field === check.column);
      if (!col) {
        throw new Error(`Column '${check.column}' missing in table '${check.table}'.`);
      }
      if (!col.Type.toLowerCase().includes('bigint')) {
        throw new Error(`Column '${check.table}.${check.column}' must be BIGINT, found '${col.Type}'.`);
      }
    }

    logger.info('MySQL Structural Verification PASSED cleanly.');
    return { success: true, message: 'MySQL Verification Passed' };
  } catch (error) {
    logger.error(`MySQL Verification FAILED: ${error.message}`);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

if (require.main === module) {
  verifyMySQL()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  verifyMySQL
};
