const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const geminiConfig = require('../../config/gemini.config');
const { logger } = require('../../utils/logger');
const { ApiError, GeminiError } = require('../../utils/apiError');

const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

/**
 * Fetches image from URL and converts to base64 inline data format for Gemini API
 */
const fetchImageAsInlineData = async (imageUrl, timeoutMs = 10000) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      headers: { Accept: 'image/*' }
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64Data = Buffer.from(response.data).toString('base64');

    return {
      inlineData: {
        data: base64Data,
        mimeType: contentType
      }
    };
  } catch (error) {
    logger.error(`Failed to download image from Cloudinary URL: ${error.message}`);
    throw ApiError.badRequest('Unable to fetch image from Cloudinary for AI analysis', 'IMAGE_FETCH_FAILED');
  }
};

/**
 * Executes Gemini generative content call with timeout and max retries
 */
const analyzeLeafImageWithGemini = async (imageUrl, cropContext, maxRetries = 2, timeoutMs = 25000) => {
  const model = genAI.getGenerativeModel({
    model: geminiConfig.modelName || 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });

  const prompt = `
You are an expert agricultural plant pathologist and crop disease specialist.
Analyze the attached crop/leaf image carefully.

Crop Context:
- Crop Name: ${cropContext.crop_name}
- Crop Variety: ${cropContext.crop_variety || 'Not specified'}
- Farm Location: ${cropContext.location || 'Not specified'}

You MUST return your diagnosis in STRICT JSON format with EXACTLY the following keys:
{
  "diseaseName": "Name of disease or Healthy Crop",
  "confidenceScore": 95.0,
  "severity": "low" | "medium" | "high",
  "environmentalRiskLevel": "low" | "medium" | "high",
  "symptoms": ["Detailed visual symptom 1", "Symptom 2"],
  "recommendations": ["Actionable advice 1", "Advice 2"],
  "preventionSteps": ["Preventative measure 1", "Measure 2"],
  "treatmentSuggestions": ["Treatment suggestion 1", "Suggestion 2"]
}

Rules:
1. confidenceScore MUST be a number between 0 and 100.
2. severity MUST be exactly one of: "low", "medium", "high".
3. environmentalRiskLevel MUST be exactly one of: "low", "medium", "high".
4. symptoms, recommendations, preventionSteps, treatmentSuggestions MUST be arrays of descriptive strings.
5. Return ONLY the JSON object. Do not include markdown code block syntax or extra text outside JSON.
`;

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      logger.info(`Sending image analysis request to Gemini AI (Attempt ${attempt}/${maxRetries + 1})...`);
      
      const imageInlineData = await fetchImageAsInlineData(imageUrl);

      // Execute request with Promise timeout wrapper
      const responsePromise = model.generateContent([prompt, imageInlineData]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs)
      );

      const result = await Promise.race([responsePromise, timeoutPromise]);
      const responseText = result.response.text();
      
      return {
        rawResponse: responseText,
        attempt
      };
    } catch (err) {
      lastError = err;
      logger.warn(`Gemini AI analysis attempt ${attempt} failed: ${err.message}`);

      if (err.message === 'GEMINI_TIMEOUT') {
        throw new GeminiError('Gemini AI API request timed out', 'GEMINI_ANALYSIS_FAILED');
      }

      // Retry only on transient errors
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new GeminiError(`Gemini AI Service failed after ${maxRetries + 1} attempts: ${lastError.message}`, 'GEMINI_ANALYSIS_FAILED');
};

module.exports = {
  fetchImageAsInlineData,
  analyzeLeafImageWithGemini
};
