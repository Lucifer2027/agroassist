const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { strictRateLimiter } = require('../middleware/security.middleware');
const { signatureRequestSchema, registerMetadataSchema } = require('../validators/upload.validator');

const router = express.Router();

// All upload endpoints require JWT authentication
router.use(authenticate);

router.post('/signature', strictRateLimiter, validate(signatureRequestSchema), uploadController.generateUploadSignature);
router.post('/metadata', validate(registerMetadataSchema), uploadController.registerAssetMetadata);
router.get('/:assetId', uploadController.getAssetById);
router.delete('/:assetId', uploadController.deleteAsset);

module.exports = router;
