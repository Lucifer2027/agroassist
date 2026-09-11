import { apiClient } from './client';

export const uploadsApi = {
  getUploadSignature: async (params = {}) => {
    return apiClient.post('/uploads/signature', params);
  },
  uploadToCloudinary: async (file, sigData) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', sigData.timestamp);
    formData.append('signature', sigData.signature);
    if (sigData.folder) formData.append('folder', sigData.folder);
    if (sigData.eager) formData.append('eager', sigData.eager);

    const cloudName = sigData.cloudName;
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Cloudinary upload failed with status code ${response.status}`);
    }

    return response.json();
  },
  registerMetadata: async (assetPayload) => {
    return apiClient.post('/uploads/metadata', assetPayload);
  },
  getAssetById: async (assetId) => {
    return apiClient.get(`/uploads/${assetId}`);
  },
  deleteAsset: async (assetId) => {
    return apiClient.delete(`/uploads/${assetId}`);
  },
};
