const weatherService = require('../services/weather.service');
const { sendSuccess } = require('../utils/apiResponse');

const getCurrentWeather = async (req, res, next) => {
  try {
    const weather = await weatherService.getCurrentWeather(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Current farm weather retrieved successfully', weather);
  } catch (error) {
    next(error);
  }
};

const getForecastWeather = async (req, res, next) => {
  try {
    const forecast = await weatherService.getForecastWeather(req.user.id, req.params.farmId, req.user.role);
    return sendSuccess(res, 200, 'Farm weather forecast retrieved successfully', forecast);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentWeather,
  getForecastWeather
};
