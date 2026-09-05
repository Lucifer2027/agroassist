const userRepository = require('./user.repository');
const farmRepository = require('./farm.repository');
const cropRepository = require('./crop.repository');
const cloudinaryAssetRepository = require('./cloudinaryAsset.repository');
const diseaseAnalysisRepository = require('./diseaseAnalysis.repository');
const weatherRecordRepository = require('./weatherRecord.repository');
const cropRiskRecordRepository = require('./cropRiskRecord.repository');
const recommendationRepository = require('./recommendation.repository');

module.exports = {
  userRepository,
  farmRepository,
  cropRepository,
  cloudinaryAssetRepository,
  diseaseAnalysisRepository,
  weatherRecordRepository,
  cropRiskRecordRepository,
  recommendationRepository
};
