const { verifyMySQL } = require('./mysql/verify');
const { verifySnowflake } = require('./snowflake/verify');

/**
 * Master Verification Tool for MySQL and Snowflake Databases
 */
const verifyAll = async () => {
  console.log('==================================================');
  console.log('AGROASSIST PRO DATABASE STRUCTURAL VERIFICATION');
  console.log('==================================================');

  let mysqlPass = false;
  let snowflakePass = false;

  try {
    await verifyMySQL();
    mysqlPass = true;
    console.log('MySQL Structural Verification    : PASS');
  } catch (err) {
    console.error(`MySQL Verification Error: ${err.message}`);
    console.log('MySQL Structural Verification    : FAIL');
  }

  try {
    await verifySnowflake();
    snowflakePass = true;
    console.log('Snowflake Analytical Verification: PASS');
  } catch (err) {
    console.error(`Snowflake Verification Error: ${err.message}`);
    console.log('Snowflake Analytical Verification: FAIL');
  }

  console.log('==================================================');

  if (mysqlPass && snowflakePass) {
    console.log('DATABASE VERIFICATION COMPLETE (ALL PASSED)');
    return true;
  } else {
    console.log('DATABASE VERIFICATION FAILED');
    process.exit(1);
  }
};

if (require.main === module) {
  verifyAll().catch(() => process.exit(1));
}

module.exports = {
  verifyAll
};
