const { env } = require('./env.config');

module.exports = {
  apiKey: env.GEMINI_API_KEY,
  modelName: 'gemini-1.5-flash'
};
