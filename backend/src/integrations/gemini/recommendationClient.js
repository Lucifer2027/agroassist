const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiConfig = require('../../config/gemini.config');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/apiError');

const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

/**
 * Generates context-aware, localized agricultural recommendations using Gemini AI
 */
const generateActionableRecommendations = async (context, language = 'en', maxRetries = 2, timeoutMs = 25000) => {
  const model = genAI.getGenerativeModel({
    model: geminiConfig.modelName || 'gemini-3-flash-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3
    }
  });

  const languageMap = {
    en: 'English',
    hi: 'Hindi (Hindi language text)',
    pa: 'Punjabi (Punjabi language text)',
    ta: 'Tamil (Tamil language text)',
    te: 'Telugu (Telugu language text)',
    bn: 'Bengali (Bengali language text)'
  };

  const targetLang = languageMap[language] || 'English';

  const prompt = `
You are a senior agricultural extension specialist and crop protection advisor assisting smallholder farmers in India.
Synthesize practical, actionable, and localized agricultural recommendations based ONLY on the following verified farm data.

Verified Context:
- Crop: ${context.crop_name} (${context.crop_variety || 'Standard Variety'})
- Farm Location: ${context.location || 'India'}
- Diagnosed Disease: ${context.disease_name}
- Pathogen Confidence: ${context.confidence_score}%
- Disease Severity: ${context.severity}
- Environmental Risk Level: ${context.environmental_risk_level}
- Calculated Agricultural Risk Score: ${context.risk_score} / 100 (${context.risk_level})
- Current Weather: Temp ${context.temperature || 'N/A'}°C, Humidity ${context.humidity || 'N/A'}%, Rainfall ${context.rainfall || 0}mm

Output Language Requirement:
Please generate ALL text fields in ${targetLang}.

SAFETY MANDATE:
Frame all chemical/fungicide/pesticide suggestions strictly as general product recommendations requiring adherence to local agricultural extension authority guidelines and official product label instructions. Do not invent arbitrary dosage measurements.

Return STRICT JSON matching EXACTLY this structure:
{
  "recommendations": [
    "Practical step 1 for farmer",
    "Practical step 2"
  ],
  "preventionSteps": [
    "Preventative measure 1",
    "Preventative measure 2"
  ],
  "treatmentSuggestions": [
    "Treatment suggestion according to local authority label guidelines"
  ],
  "timingSuggestions": [
    "Optimal timing for application (e.g. spray during early morning or late evening)"
  ]
}
`;

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      logger.info(`Sending recommendation generation request to Gemini AI (Language: ${language}, Attempt ${attempt})...`);

      const responsePromise = model.generateContent([prompt]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_REC_TIMEOUT')), timeoutMs)
      );

      const result = await Promise.race([responsePromise, timeoutPromise]);
      const responseText = result.response.text();

      return {
        rawResponse: responseText,
        attempt
      };
    } catch (err) {
      lastError = err;
      logger.warn(`Gemini recommendation generation attempt ${attempt} failed: ${err.message}`);

      if (err.message === 'GEMINI_REC_TIMEOUT') {
        throw ApiError.internal('Gemini recommendation request timed out', 'AI_TIMEOUT');
      }

      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw ApiError.internal(`Gemini recommendation service failed after ${maxRetries + 1} attempts: ${lastError.message}`, 'AI_RECOMMENDATION_FAILED');
};

module.exports = {
  generateActionableRecommendations
};
