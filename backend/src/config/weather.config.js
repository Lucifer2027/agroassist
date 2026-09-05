const { env } = require('./env.config');

module.exports = {
  apiKey: env.OPENWEATHER_API_KEY,
  baseUrl: 'https://api.openweathermap.org/data/2.5'
};
