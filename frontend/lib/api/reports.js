import { getAuthToken, BASE_URL } from './client';

export const reportsApi = {
  downloadAnalysisPdfReport: async (analysisId) => {
    const token = getAuthToken();
    const url = `${BASE_URL}/reports/analysis/${analysisId}/pdf`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download report PDF (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `agroassist-report-${analysisId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
