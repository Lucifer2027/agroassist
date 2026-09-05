const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const mysqlConfig = require('../../config/mysql.config');
const { logger } = require('../../utils/logger');

/**
 * Runs MySQL migrations reading DDL statements from schema.sql
 */
const runMigrations = async () => {
  logger.info('Starting MySQL database migration runner...');

  // Create database connection without database selected initially to ensure DB exists
  const connection = await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password
  });

  try {
    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\`;`);
    await connection.query(`USE \`${mysqlConfig.database}\`;`);
    logger.info(`Database '${mysqlConfig.database}' verified/created.`);

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL script into individual CREATE TABLE statements
    const statements = sqlScript
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    logger.info('MySQL Schema Migration completed successfully (8 operational tables created).');
    return true;
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
};

// Allow direct execution from command line
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  runMigrations
};
