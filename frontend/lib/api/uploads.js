import { apiClient } from './client';

export const uploadsApi = {
  getUploadSignature: async (params = {}) => {
    return apiClient.post('/uploads/signature', params);
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
