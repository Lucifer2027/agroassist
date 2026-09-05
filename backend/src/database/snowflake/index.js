const snowflake = require('snowflake-sdk');
const snowflakeConfig = require('../../config/snowflake.config');
const { logger } = require('../../utils/logger');
const { SnowflakeError } = require('../../utils/apiError');

let connection = null;

/**
 * Connects to Snowflake Analytical Warehouse
 */
const connectSnowflake = () => {
  return new Promise((resolve, reject) => {
    if (connection && connection.isUp()) {
      return resolve(connection);
    }

    const conn = snowflake.createConnection(snowflakeConfig);
    conn.connect((err, connInstance) => {
      if (err) {
        logger.warn(`Snowflake Warehouse Connection Warning: ${err.message}`);
        return reject(new SnowflakeError(`Snowflake connection failed: ${err.message}`, 'SNOWFLAKE_SYNC_FAILED'));
      }
      logger.info('Snowflake Analytical Warehouse connected successfully');
      connection = connInstance;
      resolve(connection);
    });
  });
};

/**
 * Executes analytical query against Snowflake
 */
const executeQuery = async (sqlText, binds = []) => {
  const conn = await connectSnowflake();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          logger.error(`Snowflake Execution Error: ${err.message}`);
          return reject(new SnowflakeError(`Snowflake query failed: ${err.message}`, 'SNOWFLAKE_SYNC_FAILED'));
        }
        resolve(rows);
      }
    });
  });
};

/**
 * Closes Snowflake connection gracefully
 */
const closeSnowflake = () => {
  return new Promise((resolve) => {
    if (connection) {
      connection.destroy((err) => {
        if (err) logger.error(`Error closing Snowflake connection: ${err.message}`);
        else logger.info('Snowflake connection destroyed.');
        connection = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  connectSnowflake,
  executeQuery,
  closeSnowflake
};
