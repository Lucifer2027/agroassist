const { logger } = require('../../utils/logger');

/**
 * Deterministic Agricultural Risk Scoring Engine
 */
class RiskEngine {
  /**
   * Calculates agricultural risk score (0-100), risk level, and explanatory factors.
   *
   * @param {Object} [diseaseAnalysis] - Latest Gemini disease analysis record
   * @param {Object} [weatherRecord] - Latest OpenWeatherMap weather record
   * @param {Object} [cropContext] - Crop details (name, status)
   * @returns {Object} { riskScore, riskLevel, riskFactors }
   */
  calculateRisk(diseaseAnalysis = null, weatherRecord = null, cropContext = null) {
    let diseasePoints = 0;
    let weatherPoints = 0;
    const riskFactors = [];

    // -------------------------------------------------------------
    // 1. Disease Component Scoring (Max 50 points)
    // -------------------------------------------------------------
    if (diseaseAnalysis && diseaseAnalysis.disease_name) {
      const diseaseName = diseaseAnalysis.disease_name;
      const confidence = Number(diseaseAnalysis.confidence_score) || 80;
      const severity = (diseaseAnalysis.severity || 'medium').toLowerCase();
      const envRisk = (diseaseAnalysis.environmental_risk_level || 'medium').toLowerCase();

      let baseSeverityPoints = 10;
      if (severity === 'high') baseSeverityPoints = 35;
      else if (severity === 'medium') baseSeverityPoints = 22;
      else if (severity === 'low') baseSeverityPoints = 10;

      // Adjust severity by confidence score ratio
      const adjustedSeverity = baseSeverityPoints * (confidence / 100);

      let envPoints = 2;
      if (envRisk === 'high') envPoints = 15;
      else if (envRisk === 'medium') envPoints = 8;

      diseasePoints = adjustedSeverity + envPoints;

      riskFactors.push(
        `Active disease detected: ${diseaseName} (Severity: ${severity.toUpperCase()}, Confidence: ${confidence}%)`
      );

      if (envRisk === 'high' || envRisk === 'medium') {
        riskFactors.push(`High environmental vulnerability reported for ${diseaseName}`);
      }
    } else {
      riskFactors.push('No recent disease scan on record');
    }

    // -------------------------------------------------------------
    // 2. Weather Component Scoring (Max 50 points)
    // -------------------------------------------------------------
    if (weatherRecord) {
      const humidity = Number(weatherRecord.humidity);
      const temp = Number(weatherRecord.temperature);
      const rainProb = Number(weatherRecord.rain_probability);
      const rainfall = Number(weatherRecord.rainfall);

      // Humidity risk scoring
      if (!isNaN(humidity)) {
        if (humidity >= 85) {
          weatherPoints += 18;
          riskFactors.push(`Extremely high relative humidity (${humidity}%) promotes rapid fungal spore propagation`);
        } else if (humidity >= 70) {
          weatherPoints += 10;
          riskFactors.push(`Elevated humidity (${humidity}%) increases crop disease risk`);
        }
      }

      // Rainfall & Rain Probability scoring
      if (!isNaN(rainProb) || !isNaN(rainfall)) {
        if (rainProb >= 70 || rainfall >= 10) {
          weatherPoints += 17;
          riskFactors.push(`High rainfall probability (${rainProb || 0}%) / rainfall (${rainfall || 0}mm) increases soil splashback and root rot risk`);
        } else if (rainProb >= 40 || rainfall >= 2) {
          weatherPoints += 9;
          riskFactors.push(`Moderate rain forecast presents leaf moisture persistence risk`);
        }
      }

      // Temperature risk scoring
      if (!isNaN(temp)) {
        if (temp > 35 || temp < 10) {
          weatherPoints += 15;
          riskFactors.push(`Extreme temperature (${temp}°C) induces heat/cold stress, weakening plant immunity`);
        } else if (temp >= 25 && temp <= 35 && humidity >= 70) {
          weatherPoints += 8;
          riskFactors.push(`Warm temperature (${temp}°C) combined with high humidity accelerates microbial proliferation`);
        }
      }
    } else {
      riskFactors.push('Weather observation unavailable for farm location');
    }

    // -------------------------------------------------------------
    // 3. Final Bounded Score Computation & Risk Level Categorization
    // -------------------------------------------------------------
    const rawScore = diseasePoints + weatherPoints;
    const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let riskLevel = 'low';
    if (riskScore >= 85) {
      riskLevel = 'critical';
    } else if (riskScore >= 65) {
      riskLevel = 'high';
    } else if (riskScore >= 35) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      riskScore,
      riskLevel,
      riskFactors
    };
  }
}

module.exports = new RiskEngine();
