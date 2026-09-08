const mysql = require('mysql2/promise');
const mysqlConfig = require('../../config/mysql.config');
const { logger } = require('../../utils/logger');

/**
 * Checks MySQL Database Migration & Operational Status
 */
const statusMySQL = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });

    const [databases] = await connection.query(`SHOW DATABASES LIKE '${mysqlConfig.database}'`);
    if (databases.length === 0) {
      logger.warn(`MySQL Status: Database '${mysqlConfig.database}' does not exist.`);
      return {
        connected: true,
        database: mysqlConfig.database,
        exists: false,
        migrationCount: 0,
        pendingMigrations: 1
      };
    }

    await connection.query(`USE \`${mysqlConfig.database}\`;`);

    const [tables] = await connection.query("SHOW TABLES LIKE 'schema_migrations'");
    let migrationCount = 0;
    if (tables.length > 0) {
      const [rows] = await connection.query('SELECT COUNT(*) AS total FROM schema_migrations');
      migrationCount = rows[0]?.total || 0;
    }

    const pendingMigrations = migrationCount > 0 ? 0 : 1;

    const statusReport = {
      connected: true,
      database: mysqlConfig.database,
      exists: true,
      migrationCount,
      pendingMigrations
    };

    logger.info(`MySQL Status: Database '${mysqlConfig.database}' exists. Applied Migrations: ${migrationCount}, Pending: ${pendingMigrations}`);
    return statusReport;
  } catch (error) {
    logger.error(`MySQL Status Check FAILED: ${error.message}`);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

if (require.main === module) {
  statusMySQL()
    .then((status) => {
      console.log('MySQL Status:', JSON.stringify(status, null, 2));
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = {
  statusMySQL
};
