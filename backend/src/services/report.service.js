const PDFDocument = require('pdfkit');
const axios = require('axios');
const diseaseAnalysisRepository = require('../repositories/diseaseAnalysis.repository');
const userRepository = require('../repositories/user.repository');
const farmRepository = require('../repositories/farm.repository');
const cropRepository = require('../repositories/crop.repository');
const cloudinaryAssetRepository = require('../repositories/cloudinaryAsset.repository');
const weatherRecordRepository = require('../repositories/weatherRecord.repository');
const cropRiskRecordRepository = require('../repositories/cropRiskRecord.repository');
const { NotFoundError, AuthorizationError, ReportGenerationError } = require('../utils/apiError');
const { logger } = require('../utils/logger');

class ReportService {
  /**
   * Downloads image buffer from Cloudinary URL safely (handling failures gracefully)
   */
  async fetchImageBuffer(imageUrl, timeoutMs = 8000) {
    if (!imageUrl) return null;
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: timeoutMs
      });
      return Buffer.from(response.data);
    } catch (err) {
      logger.warn(`PDF Report image fetch warning for ${imageUrl}: ${err.message}`);
      return null;
    }
  }

  /**
   * Generates a professional PDF Report Document for an AI crop disease analysis
   */
  async generateAnalysisPdfReport(userId, analysisId, userRole = 'farmer') {
    // 1. Retrieve disease analysis record
    const analysis = await diseaseAnalysisRepository.findById(analysisId);
    if (!analysis) {
      throw new NotFoundError(`Disease analysis record not found with ID: ${analysisId}`, 'ANALYSIS_NOT_FOUND');
    }

    // 2. Validate ownership
    if (analysis.user_id !== userId && userRole !== 'admin') {
      throw new AuthorizationError('Forbidden: You do not own this analysis report', 'UNAUTHORIZED_REPORT_ACCESS');
    }

    try {
      // 3. Fetch full operational context from MySQL
      const [user, farm, crop, asset, weatherList, riskList] = await Promise.all([
        userRepository.findById(analysis.user_id),
        farmRepository.findById(analysis.farm_id),
        cropRepository.findById(analysis.crop_id),
        analysis.cloudinary_asset_id ? cloudinaryAssetRepository.findById(analysis.cloudinary_asset_id) : null,
        weatherRecordRepository.findByFarmId(analysis.farm_id, 1),
        cropRiskRecordRepository.findByCropId(analysis.crop_id)
      ]);

      const weather = weatherList && weatherList.length ? weatherList[0] : null;
      const risk = riskList && riskList.length ? riskList[0] : null;

      // Fetch images asynchronously
      const optimizedImageBuffer = asset ? await this.fetchImageBuffer(asset.optimized_url || asset.original_url) : null;
      const annotatedImageBuffer = asset && asset.annotated_url ? await this.fetchImageBuffer(asset.annotated_url) : null;

      // 4. Create PDFKit Document
      const doc = new PDFDocument({ size: 'A4', margin: 40 });

      // Document Header
      doc.fillColor('#1b4332').fontSize(24).text('AGROASSIST PRO', { align: 'center', bold: true });
      doc.fillColor('#2d6a4f').fontSize(14).text('AI Crop Health & Disease Diagnosis Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.strokeColor('#d8f3dc').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // Section 1: Farmer & Farm & Crop Profile Table
      doc.fillColor('#081c15').fontSize(14).text('Farmer & Field Context', { underline: true });
      doc.fontSize(10).fillColor('#2b2d42');
      doc.text(`Farmer Name: ${user ? `${user.first_name} ${user.last_name}` : 'N/A'}`);
      doc.text(`Farmer Email: ${user ? user.email : 'N/A'} | Location: ${user ? user.location || 'N/A' : 'N/A'}`);
      doc.text(`Farm Name: ${farm ? farm.farm_name : 'N/A'} | Soil Type: ${farm ? farm.soil_type || 'N/A' : 'N/A'}`);
      doc.text(`Crop Name: ${crop ? crop.crop_name : 'N/A'} (Variety: ${crop ? crop.crop_variety || 'N/A' : 'N/A'})`);
      doc.text(`Report Generated At: ${new Date().toLocaleString()}`);
      doc.moveDown(1);

      // Section 2: AI Disease Diagnosis Summary
      doc.fillColor('#081c15').fontSize(14).text('AI Disease Diagnosis Summary', { underline: true });
      doc.fontSize(11).fillColor('#d90429').text(`Diagnosed Disease: ${analysis.disease_name}`);
      doc.fontSize(10).fillColor('#2b2d42');
      doc.text(`Confidence Score: ${analysis.confidence_score}%`);
      doc.text(`Severity Level: ${analysis.severity.toUpperCase()}`);
      doc.text(`Environmental Vulnerability: ${analysis.environmental_risk_level.toUpperCase()}`);
      doc.text(`Calculated Agricultural Risk: ${risk ? `${risk.risk_score} / 100 (${risk.risk_level.toUpperCase()})` : 'N/A'}`);
      doc.moveDown(1);

      // Section 3: Weather Micro-Climate Snapshot
      doc.fillColor('#081c15').fontSize(14).text('Farm Micro-Climate Snapshot', { underline: true });
      doc.fontSize(10).fillColor('#2b2d42');
      if (weather) {
        doc.text(`Temperature: ${weather.temperature !== null ? `${weather.temperature}°C` : 'N/A'}`);
        doc.text(`Relative Humidity: ${weather.humidity !== null ? `${weather.humidity}%` : 'N/A'}`);
        doc.text(`Precipitation / Rain: ${weather.rainfall !== null ? `${weather.rainfall} mm` : '0 mm'}`);
        doc.text(`Weather Condition: ${weather.weather_condition || 'N/A'}`);
      } else {
        doc.text('Weather observation data unavailable at time of report generation.');
      }
      doc.moveDown(1);

      // Section 4: Visual Symptoms & Actionable Recommendations
      doc.fillColor('#081c15').fontSize(14).text('Actionable AI Recommendations & Prevention', { underline: true });
      doc.fontSize(10).fillColor('#2b2d42');
      
      if (Array.isArray(analysis.symptoms) && analysis.symptoms.length) {
        doc.font('Helvetica-Bold').text('Observed Symptoms:');
        doc.font('Helvetica');
        analysis.symptoms.forEach((sym) => doc.text(`• ${sym}`));
      }

      if (Array.isArray(analysis.recommendations) && analysis.recommendations.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Recommended Actions:');
        doc.font('Helvetica');
        analysis.recommendations.forEach((rec) => doc.text(`• ${rec}`));
      }

      if (Array.isArray(analysis.prevention_steps) && analysis.prevention_steps.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Prevention Steps:');
        doc.font('Helvetica');
        analysis.prevention_steps.forEach((prev) => doc.text(`• ${prev}`));
      }

      if (Array.isArray(analysis.treatment_suggestions) && analysis.treatment_suggestions.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Treatment Guidance (Adhere to local authority label instructions):');
        doc.font('Helvetica');
        analysis.treatment_suggestions.forEach((treat) => doc.text(`• ${treat}`));
      }

      doc.moveDown(1);

      // Section 5: Embed Crop Images (if buffers available)
      if (optimizedImageBuffer) {
        try {
          doc.addPage();
          doc.fillColor('#081c15').fontSize(14).text('Diagnosed Leaf Image Artifacts', { underline: true });
          doc.moveDown(1);
          doc.image(optimizedImageBuffer, { fit: [250, 200], align: 'center' });
          doc.fontSize(9).fillColor('#6c757d').text('Optimized Cloudinary Leaf Scan (800x600)', { align: 'center' });

          if (annotatedImageBuffer) {
            doc.moveDown(1);
            doc.image(annotatedImageBuffer, { fit: [250, 200], align: 'center' });
            doc.fontSize(9).fillColor('#6c757d').text('Annotated Diagnostic Overlay', { align: 'center' });
          }
        } catch (imgErr) {
          logger.warn(`Could not render image buffer in PDF: ${imgErr.message}`);
        }
      }

      // Document Footer
      doc.fontSize(8).fillColor('#a0a0a0').text(
        'AgroAssist Pro AI Platform • Document generated automatically. Always verify chemical treatments with local agricultural authority.',
        40, 800, { align: 'center' }
      );

      return doc;
    } catch (err) {
      if (err.isOperational) throw err;
      logger.error(`PDF report generation error: ${err.message}`);
      throw new ReportGenerationError(`Failed to generate PDF crop health report: ${err.message}`, 'PDF_GENERATION_FAILED');
    }
  }
}

module.exports = new ReportService();
