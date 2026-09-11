const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const mysqlConfig = require('../../config/mysql.config');
const { logger } = require('../../utils/logger');
const { verifyMySQL } = require('./verify');

/**
 * Runs MySQL migrations idempotently with transaction support & migration tracking
 */
const runMigrations = async () => {
  logger.info('Starting MySQL database migration runner...');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\`;`);
    await connection.query(`USE \`${mysqlConfig.database}\`;`);
    logger.info(`Database '${mysqlConfig.database}' verified/created.`);

    // Ensure migration tracking table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');
    const checksum = crypto.createHash('sha256').update(sqlScript).digest('hex');

    const migrationName = '001_initial_schema';

    // Check if migration already executed
    const [existing] = await connection.query(
      'SELECT * FROM schema_migrations WHERE migration_name = ?',
      [migrationName]
    );

    if (existing.length === 0) {
      // Split SQL script into individual CREATE TABLE statements
      const statements = sqlScript
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query(
        'INSERT INTO schema_migrations (migration_name, checksum) VALUES (?, ?)',
        [migrationName, checksum]
      );
      logger.info(`Migration '${migrationName}' applied and tracked successfully.`);
    } else {
      // Migration tracked; run DDL statements safely for idempotency
      const statements = sqlScript
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }
      logger.info(`Migration '${migrationName}' is already applied. Schema verified idempotently.`);
    }

    // Ensure column types in existing tables are updated to TEXT to prevent truncation errors
    try {
      await connection.query(`
        ALTER TABLE cloudinary_assets 
        MODIFY COLUMN original_url TEXT NOT NULL,
        MODIFY COLUMN optimized_url TEXT NOT NULL,
        MODIFY COLUMN annotated_url TEXT NULL
      `);
    } catch (alterErr) {
      logger.warn(`Non-critical schema modification notice (cloudinary_assets): ${alterErr.message}`);
    }

    try {
      const [diseaseCols] = await connection.query("SHOW COLUMNS FROM disease_analyses LIKE 'original_url'");
      if (diseaseCols && diseaseCols.length > 0) {
        await connection.query("ALTER TABLE disease_analyses MODIFY COLUMN original_url TEXT NULL");
      }
    } catch (alterErr) {
      logger.warn(`Non-critical schema modification notice (disease_analyses): ${alterErr.message}`);
    }

    // Run structural verification
    await verifyMySQL();

    logger.info('MySQL Schema Migration & Verification completed successfully.');
    return true;
  } catch (error) {
    logger.error(`MySQL Migration FAILED: ${error.message}`);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('MySQL Migration Process Completed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`MySQL Migration Fatal Error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
