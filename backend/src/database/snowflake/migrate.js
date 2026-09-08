const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const snowflakeConfig = require('../../config/snowflake.config');
const { connectSnowflake, executeQuery, closeSnowflake } = require('./index');
const { verifySnowflake } = require('./verify');
const { logger } = require('../../utils/logger');

/**
 * Executes Snowflake Schema Migrations & Tracking
 */
const runSnowflakeMigrations = async () => {
  logger.info('Starting Snowflake Data Warehouse migration runner...');

  try {
    if (!snowflakeConfig.account || !snowflakeConfig.username) {
      throw new Error('Snowflake credentials/account settings are not fully configured in environment.');
    }

    await connectSnowflake();

    // 1. Ensure CORE schema exists for tracking
    await executeQuery('CREATE SCHEMA IF NOT EXISTS CORE;');

    // 2. Ensure migration tracking table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS CORE.SCHEMA_MIGRATIONS (
        migration_id INT AUTOINCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE,
        checksum VARCHAR(64),
        executed_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      );
    `);

    // 3. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');
    const checksum = crypto.createHash('sha256').update(sqlScript).digest('hex');

    const migrationName = '001_initial_snowflake_schema';

    // Split SQL script by semicolon into individual DDL statements
    const statements = sqlScript
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await executeQuery(statement);
    }

    await executeQuery(`
      INSERT INTO CORE.SCHEMA_MIGRATIONS (migration_name, checksum)
      SELECT '${migrationName}', '${checksum}'
      WHERE NOT EXISTS (SELECT 1 FROM CORE.SCHEMA_MIGRATIONS WHERE migration_name = '${migrationName}');
    `);

    logger.info(`Snowflake migration '${migrationName}' executed successfully.`);

    // 4. Verify post-migration structure
    await verifySnowflake();

    logger.info('Snowflake Schema Migration & Verification completed successfully.');
    return true;
  } catch (error) {
    logger.error(`Snowflake Migration FAILED: ${error.message}`);
    throw error;
  } finally {
    await closeSnowflake();
  }
};

if (require.main === module) {
  runSnowflakeMigrations()
    .then(() => {
      logger.info('Snowflake Migration Process Completed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`Snowflake Migration Fatal Error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = {
  runSnowflakeMigrations
};
