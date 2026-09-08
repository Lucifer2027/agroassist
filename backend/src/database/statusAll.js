const { statusMySQL } = require('./mysql/status');
const { statusSnowflake } = require('./snowflake/status');

/**
 * Combined Status Checker for MySQL and Snowflake
 */
const statusAll = async () => {
  console.log('==================================================');
  console.log('AGROASSIST PRO DATABASE STATUS');
  console.log('==================================================');

  let mysqlRes = null;
  let snowflakeRes = null;
  let errorOccurred = false;

  try {
    mysqlRes = await statusMySQL();
    console.log('\nMYSQL STATUS:');
    console.log(`  Connection        : PASS`);
    console.log(`  Database          : ${mysqlRes.database}`);
    console.log(`  Exists            : ${mysqlRes.exists}`);
    console.log(`  Applied Migrations: ${mysqlRes.migrationCount}`);
    console.log(`  Pending Migrations: ${mysqlRes.pendingMigrations}`);
  } catch (err) {
    errorOccurred = true;
    console.log('\nMYSQL STATUS:');
    console.log(`  Connection        : FAIL (${err.message})`);
  }

  try {
    snowflakeRes = await statusSnowflake();
    console.log('\nSNOWFLAKE STATUS:');
    console.log(`  Connection        : ${snowflakeRes.connected ? 'PASS' : 'FAIL'}`);
    console.log(`  Database          : ${snowflakeRes.database}`);
    console.log(`  Schema            : ${snowflakeRes.schema}`);
    console.log(`  Applied Migrations: ${snowflakeRes.migrationCount}`);
    console.log(`  Pending Migrations: ${snowflakeRes.pendingMigrations}`);
    if (!snowflakeRes.connected) errorOccurred = true;
  } catch (err) {
    errorOccurred = true;
    console.log('\nSNOWFLAKE STATUS:');
    console.log(`  Connection        : FAIL (${err.message})`);
  }

  console.log('==================================================');
  if (errorOccurred) {
    process.exit(1);
  }
};

if (require.main === module) {
  statusAll().catch(() => process.exit(1));
}

module.exports = {
  statusAll
};
