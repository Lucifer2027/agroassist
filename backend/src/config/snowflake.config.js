const { env } = require('./env.config');

module.exports = {
  account: env.SNOWFLAKE_ACCOUNT,
  username: env.SNOWFLAKE_USERNAME,
  password: env.SNOWFLAKE_PASSWORD,
  database: env.SNOWFLAKE_DATABASE,
  schema: env.SNOWFLAKE_SCHEMA,
  warehouse: env.SNOWFLAKE_WAREHOUSE,
  role: env.SNOWFLAKE_ROLE
};
