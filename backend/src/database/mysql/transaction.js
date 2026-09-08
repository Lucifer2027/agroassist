const { logger } = require('../../utils/logger');

const withTransaction = async (callback) => {
  const { getPool } = require('./index');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Execute parameterized queries within connection transaction scope
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error(`Transaction rolled back due to error: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  withTransaction
};
