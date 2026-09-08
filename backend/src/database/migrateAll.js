const { runMigrations: runMySQLMigrations } = require('./mysql/migrate');
const { verifyMySQL } = require('./mysql/verify');
const { runSnowflakeMigrations } = require('./snowflake/migrate');
const { verifySnowflake } = require('./snowflake/verify');
const { logger } = require('../utils/logger');

/**
 * Master Database Migration Runner for AgroAssist Pro (MySQL + Snowflake)
 */
const migrateAll = async () => {
  console.log('==================================================');
  console.log('AGROASSIST PRO DATABASE MIGRATION');
  console.log('==================================================');

  let mysqlStatus = { connection: 'FAIL', migrations: 'FAIL', verification: 'FAIL' };
  let snowflakeStatus = { connection: 'FAIL', migrations: 'FAIL', verification: 'FAIL' };
  let failedStep = null;
  let failureReason = null;

  // 1. Execute MySQL Migration & Verification
  try {
    mysqlStatus.connection = 'PASS';
    await runMySQLMigrations();
    mysqlStatus.migrations = 'PASS';
    await verifyMySQL();
    mysqlStatus.verification = 'PASS';
  } catch (err) {
    failedStep = 'MySQL Migration / Verification';
    failureReason = err.message;
    console.error(`[MySQL Error]: ${err.message}`);
  }

  // 2. Execute Snowflake Migration & Verification
  try {
    snowflakeStatus.connection = 'PASS';
    await runSnowflakeMigrations();
    snowflakeStatus.migrations = 'PASS';
    await verifySnowflake();
    snowflakeStatus.verification = 'PASS';
  } catch (err) {
    if (!failedStep) {
      failedStep = 'Snowflake Migration / Verification';
      failureReason = err.message;
    }
    console.error(`[Snowflake Error]: ${err.message}`);
  }

  const allPassed =
    mysqlStatus.connection === 'PASS' &&
    mysqlStatus.migrations === 'PASS' &&
    mysqlStatus.verification === 'PASS' &&
    snowflakeStatus.connection === 'PASS' &&
    snowflakeStatus.migrations === 'PASS' &&
    snowflakeStatus.verification === 'PASS';

  if (allPassed) {
    console.log('\nMYSQL');
    console.log(`Connection       : ${mysqlStatus.connection}`);
    console.log(`Migrations       : ${mysqlStatus.migrations}`);
    console.log(`Verification     : ${mysqlStatus.verification}`);
    console.log('\nSNOWFLAKE');
    console.log(`Connection       : ${snowflakeStatus.connection}`);
    console.log(`Migrations       : ${snowflakeStatus.migrations}`);
    console.log(`Verification     : ${snowflakeStatus.verification}`);
    console.log('\n==================================================');
    console.log('DATABASE MIGRATION COMPLETE');
    console.log('==================================================');
    return true;
  } else {
    console.log('\n==================================================');
    console.log('DATABASE MIGRATION FAILED');
    console.log('==================================================');
    console.log('MySQL:');
    console.log(`  Connection   : ${mysqlStatus.connection}`);
    console.log(`  Migrations   : ${mysqlStatus.migrations}`);
    console.log(`  Verification : ${mysqlStatus.verification}`);
    console.log('Snowflake:');
    console.log(`  Connection   : ${snowflakeStatus.connection}`);
    console.log(`  Migrations   : ${snowflakeStatus.migrations}`);
    console.log(`  Verification : ${snowflakeStatus.verification}`);
    console.log(`\nFailed step: ${failedStep}`);
    console.log(`Reason: ${failureReason}`);
    console.log('Exit code: 1');
    process.exit(1);
  }
};

if (require.main === module) {
  migrateAll().catch(() => process.exit(1));
}

module.exports = {
  migrateAll
};
