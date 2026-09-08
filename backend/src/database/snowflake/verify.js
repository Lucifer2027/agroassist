const snowflakeConfig = require('../../config/snowflake.config');
const { connectSnowflake, executeQuery, closeSnowflake } = require('./index');
const { logger } = require('../../utils/logger');

/**
 * Structural & Analytical Verification for Snowflake Warehouse
 */
const verifySnowflake = async () => {
  logger.info('Starting Snowflake Structural Verification...');

  try {
    if (!snowflakeConfig.account || !snowflakeConfig.username) {
      throw new Error('Snowflake environment variables (SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME) are not configured.');
    }

    await connectSnowflake();

    // 1. Verify Schemas
    const schemas = ['RAW', 'CORE', 'ANALYTICS'];
    for (const schema of schemas) {
      await executeQuery(`SHOW SCHEMAS LIKE '${schema}'`);
    }

    // 2. Verify Core Analytical Tables
    const tables = [
      'CORE.DIM_FARMER_FARM_CROP',
      'CORE.HISTORICAL_DISEASE_ANALYSIS',
      'CORE.HISTORICAL_WEATHER_DATA',
      'CORE.CROP_RISK_METRICS'
    ];

    for (const table of tables) {
      await executeQuery(`SELECT 1 FROM ${table} WHERE 1=0`);
    }

    // 3. Verify Analytical Views Execution
    const views = [
      'ANALYTICS.DISEASE_TRENDS',
      'ANALYTICS.RISK_EVOLUTION',
      'ANALYTICS.WEATHER_DISEASE_CORRELATION',
      'ANALYTICS.CROP_HEALTH_SUMMARY',
      'ANALYTICS.FARM_ANALYTICS'
    ];

    for (const view of views) {
      await executeQuery(`SELECT * FROM ${view} LIMIT 1`);
    }

    logger.info('Snowflake Analytical Verification PASSED cleanly.');
    return { success: true, message: 'Snowflake Verification Passed' };
  } catch (error) {
    logger.error(`Snowflake Verification FAILED: ${error.message}`);
    throw error;
  } finally {
    await closeSnowflake();
  }
};

if (require.main === module) {
  verifySnowflake()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  verifySnowflake
};
