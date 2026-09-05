const app = require('./app');
const { env } = require('./config/env.config');
const { logger } = require('./utils/logger');
const { testConnection: testMySQLConnection, closePool: closeMySQLPool } = require('./database/mysql');
const { closeSnowflake } = require('./database/snowflake');

const PORT = env.PORT || 5000;

// Start Express HTTP Server
const server = app.listen(PORT, async () => {
  logger.info(`==================================================`);
  logger.info(` AgroAssist Pro API Backend running on port ${PORT}`);
  logger.info(` Environment: ${env.NODE_ENV}`);
  logger.info(` Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`==================================================`);

  // Test database connection modules status
  await testMySQLConnection();
});

/**
 * Handles Graceful Shutdown of Express server and Database pools
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('Express HTTP server closed.');

    try {
      await closeMySQLPool();
      await closeSnowflake();
      logger.info('All database connections successfully terminated.');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during database cleanup: ${error.message}`);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Uncaught Exceptions and Unhandled Rejections
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

module.exports = server;
