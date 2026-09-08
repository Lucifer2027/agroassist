const { env } = require('./env.config');

module.exports = {
  apiKey: env.GEMINI_API_KEY,
  modelName: 'gemini-3-flash-preview'
};
