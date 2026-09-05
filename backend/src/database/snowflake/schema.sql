-- AgroAssist Pro Snowflake Data Warehouse Analytical Schema

CREATE SCHEMA IF NOT EXISTS RAW;
CREATE SCHEMA IF NOT EXISTS CORE;
CREATE SCHEMA IF NOT EXISTS ANALYTICS;

-- 1. Dimensional Farmer/Farm/Crop Entity
CREATE TABLE IF NOT EXISTS CORE.DIM_FARMER_FARM_CROP (
  dim_key VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  farmer_name VARCHAR(200),
  farm_name VARCHAR(150),
  crop_name VARCHAR(150),
  crop_variety VARCHAR(150),
  location VARCHAR(255),
  latitude NUMBER(10, 8),
  longitude NUMBER(11, 8),
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 2. Historical Disease Analysis Table
CREATE TABLE IF NOT EXISTS CORE.HISTORICAL_DISEASE_ANALYSIS (
  analysis_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  cloudinary_asset_id VARCHAR(36),
  disease_name VARCHAR(255) NOT NULL,
  confidence_score NUMBER(5, 2) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  environmental_risk_level VARCHAR(20) NOT NULL,
  symptoms_count NUMBER(5, 0),
  analysis_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 3. Historical Weather Data Table
CREATE TABLE IF NOT EXISTS CORE.HISTORICAL_WEATHER_DATA (
  weather_id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL,
  latitude NUMBER(10, 8),
  longitude NUMBER(11, 8),
  temperature NUMBER(5, 2),
  humidity NUMBER(5, 2),
  rainfall NUMBER(6, 2),
  wind_speed NUMBER(5, 2),
  weather_condition VARCHAR(100),
  rain_probability NUMBER(5, 2),
  observation_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 4. Crop Risk Metrics History Table
CREATE TABLE IF NOT EXISTS CORE.CROP_RISK_METRICS (
  risk_id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  disease_analysis_id VARCHAR(36),
  risk_score NUMBER(5, 2) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  calculated_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 5. Analytical Views in ANALYTICS Schema
CREATE OR REPLACE VIEW ANALYTICS.DISEASE_TRENDS AS
SELECT 
  farm_id,
  crop_id,
  disease_name,
  severity,
  COUNT(analysis_id) AS total_occurrences,
  AVG(confidence_score) AS avg_confidence,
  MAX(analysis_timestamp) AS last_detected
FROM CORE.HISTORICAL_DISEASE_ANALYSIS
GROUP BY farm_id, crop_id, disease_name, severity;

CREATE OR REPLACE VIEW ANALYTICS.RISK_EVOLUTION AS
SELECT 
  farm_id,
  crop_id,
  AVG(risk_score) AS avg_risk_score,
  MAX(risk_score) AS max_risk_score,
  COUNT(risk_id) AS total_assessments,
  MAX(calculated_timestamp) AS latest_assessment
FROM CORE.CROP_RISK_METRICS
GROUP BY farm_id, crop_id;

CREATE OR REPLACE VIEW ANALYTICS.WEATHER_DISEASE_CORRELATION AS
SELECT 
  w.farm_id,
  AVG(w.temperature) AS avg_temperature,
  AVG(w.humidity) AS avg_humidity,
  SUM(w.rainfall) AS total_rainfall,
  COUNT(DISTINCT d.analysis_id) AS disease_count
FROM CORE.HISTORICAL_WEATHER_DATA w
LEFT JOIN CORE.HISTORICAL_DISEASE_ANALYSIS d ON w.farm_id = d.farm_id
GROUP BY w.farm_id;

CREATE OR REPLACE VIEW ANALYTICS.CROP_HEALTH_SUMMARY AS
SELECT 
  dim.farm_id,
  dim.crop_id,
  dim.crop_name,
  r.avg_risk_score,
  r.max_risk_score,
  t.disease_name AS primary_disease
FROM CORE.DIM_FARMER_FARM_CROP dim
LEFT JOIN ANALYTICS.RISK_EVOLUTION r ON dim.crop_id = r.crop_id
LEFT JOIN ANALYTICS.DISEASE_TRENDS t ON dim.crop_id = t.crop_id;

CREATE OR REPLACE VIEW ANALYTICS.FARM_ANALYTICS AS
SELECT 
  farm_id,
  COUNT(DISTINCT crop_id) AS total_crops,
  AVG(confidence_score) AS avg_disease_confidence
FROM CORE.HISTORICAL_DISEASE_ANALYSIS
GROUP BY farm_id;
