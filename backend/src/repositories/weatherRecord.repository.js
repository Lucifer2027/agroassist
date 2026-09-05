const { query } = require('../database/mysql');

class WeatherRecordRepository {
  async create(weatherData, conn = null) {
    const {
      farm_id,
      latitude = null,
      longitude = null,
      temperature = null,
      humidity = null,
      rainfall = null,
      wind_speed = null,
      weather_condition = null,
      rain_probability = null,
      weather_timestamp = new Date()
    } = weatherData;

    const sql = `
      INSERT INTO weather_records (
        farm_id, latitude, longitude, temperature, humidity,
        rainfall, wind_speed, weather_condition, rain_probability, weather_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      farm_id, latitude, longitude, temperature, humidity,
      rainfall, wind_speed, weather_condition, rain_probability, weather_timestamp
    ];

    const result = await query(sql, params, conn);
    const recordId = result?.insertId || weatherData?.id;
    return this.findById(recordId, conn);
  }

  async findById(id, conn = null) {
    const sql = `SELECT * FROM weather_records WHERE id = ?`;
    const rows = await query(sql, [id], conn);
    return rows.length ? rows[0] : null;
  }

  async findByFarmId(farmId, limit = 20, conn = null) {
    const sql = `SELECT * FROM weather_records WHERE farm_id = ? ORDER BY weather_timestamp DESC LIMIT ?`;
    return query(sql, [farmId, Number(limit)], conn);
  }

  async delete(id, conn = null) {
    const sql = `DELETE FROM weather_records WHERE id = ?`;
    const result = await query(sql, [id], conn);
    return result.affectedRows > 0;
  }
}

module.exports = new WeatherRecordRepository();
