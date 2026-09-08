const snowflakeConfig = require('../../config/snowflake.config');
const { connectSnowflake, executeQuery, closeSnowflake } = require('./index');
const { logger } = require('../../utils/logger');

/**
 * Status Check for Snowflake Warehouse
 */
const statusSnowflake = async () => {
  try {
    if (!snowflakeConfig.account || !snowflakeConfig.username) {
      logger.warn('Snowflake status check: Snowflake environment variables not fully configured.');
      return {
        connected: false,
        configured: false,
        database: snowflakeConfig.database,
        schema: snowflakeConfig.schema,
        migrationCount: 0,
        pendingMigrations: 1,
        reason: 'Unconfigured credentials'
      };
    }

    await connectSnowflake();

    let migrationCount = 0;
    try {
      const rows = await executeQuery('SELECT COUNT(*) AS TOTAL FROM CORE.SCHEMA_MIGRATIONS');
      migrationCount = rows?.[0]?.TOTAL || 0;
    } catch {
      migrationCount = 0;
    }

    const pendingMigrations = migrationCount > 0 ? 0 : 1;

    const report = {
      connected: true,
      configured: true,
      database: snowflakeConfig.database,
      schema: snowflakeConfig.schema,
      migrationCount,
      pendingMigrations
    };

    logger.info(`Snowflake Status: Connected to Database '${snowflakeConfig.database}'. Applied Migrations: ${migrationCount}, Pending: ${pendingMigrations}`);
    return report;
  } catch (error) {
    logger.error(`Snowflake Status Check FAILED: ${error.message}`);
    throw error;
  } finally {
    await closeSnowflake();
  }
};

if (require.main === module) {
  statusSnowflake()
    .then((res) => {
      console.log('Snowflake Status:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = {
  statusSnowflake
};
