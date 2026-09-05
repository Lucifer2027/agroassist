const reportService = require('../services/report.service');

const downloadAnalysisPdfReport = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const pdfDoc = await reportService.generateAnalysisPdfReport(
      req.user.id, analysisId, req.user.role
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="agroassist_report_${analysisId}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadAnalysisPdfReport
};
