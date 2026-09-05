/**
 * GET /api/health
 * Health check endpoint for system readiness and diagnostics
 */
const getHealthStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'AgroAssist Pro API is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
