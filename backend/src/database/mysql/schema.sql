-- AgroAssist Pro MySQL Primary Transactional Schema

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  location VARCHAR(255) NULL,
  profile_image_url VARCHAR(500) NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  role ENUM('farmer', 'admin') NOT NULL DEFAULT 'farmer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_google_id (google_id),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  farm_name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  area DECIMAL(10, 2) NULL,
  area_unit VARCHAR(20) DEFAULT 'acres',
  soil_type VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_farms_user_id (user_id),
  INDEX idx_farms_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crops (
  id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL,
  crop_name VARCHAR(150) NOT NULL,
  crop_variety VARCHAR(150) NULL,
  sowing_date DATE NULL,
  expected_harvest_date DATE NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_crops_farm_id (farm_id),
  INDEX idx_crops_name (crop_name),
  INDEX idx_crops_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cloudinary_assets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  farm_id VARCHAR(36) NULL,
  crop_id VARCHAR(36) NULL,
  public_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) DEFAULT 'image',
  original_url VARCHAR(1000) NOT NULL,
  optimized_url VARCHAR(1000) NOT NULL,
  annotated_url VARCHAR(1000) NULL,
  width INT NULL,
  height INT NULL,
  format VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
  INDEX idx_cloudinary_user_id (user_id),
  INDEX idx_cloudinary_public_id (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS disease_analyses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  cloudinary_asset_id VARCHAR(36) NULL,
  disease_name VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  environmental_risk_level ENUM('low', 'medium', 'high') NOT NULL,
  symptoms JSON NULL,
  recommendations JSON NULL,
  prevention_steps JSON NULL,
  treatment_suggestions JSON NULL,
  gemini_raw_response JSON NULL,
  analysis_status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
  FOREIGN KEY (cloudinary_asset_id) REFERENCES cloudinary_assets(id) ON DELETE SET NULL,
  INDEX idx_disease_user_id (user_id),
  INDEX idx_disease_farm_id (farm_id),
  INDEX idx_disease_crop_id (crop_id),
  INDEX idx_disease_name (disease_name),
  INDEX idx_disease_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS weather_records (
  id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  temperature DECIMAL(5, 2) NULL,
  humidity DECIMAL(5, 2) NULL,
  rainfall DECIMAL(6, 2) NULL,
  wind_speed DECIMAL(5, 2) NULL,
  weather_condition VARCHAR(100) NULL,
  rain_probability DECIMAL(5, 2) NULL,
  weather_timestamp TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_weather_farm_id (farm_id),
  INDEX idx_weather_timestamp (weather_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crop_risk_records (
  id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  disease_analysis_id VARCHAR(36) NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  risk_factors JSON NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
  FOREIGN KEY (disease_analysis_id) REFERENCES disease_analyses(id) ON DELETE SET NULL,
  INDEX idx_risk_farm_id (farm_id),
  INDEX idx_risk_crop_id (crop_id),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR(36) PRIMARY KEY,
  disease_analysis_id VARCHAR(36) NOT NULL,
  farm_id VARCHAR(36) NOT NULL,
  crop_id VARCHAR(36) NOT NULL,
  recommendation_type VARCHAR(100) NULL,
  recommendation_text TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (disease_analysis_id) REFERENCES disease_analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
  INDEX idx_rec_disease_id (disease_analysis_id),
  INDEX idx_rec_farm_id (farm_id),
  INDEX idx_rec_crop_id (crop_id),
  INDEX idx_rec_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
