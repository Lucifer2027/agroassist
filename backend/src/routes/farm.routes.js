const express = require('express');
const farmController = require('../controllers/farm.controller');
const cropController = require('../controllers/crop.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createFarmSchema, updateFarmSchema, paginationQuerySchema } = require('../validators/farm.validator');
const { createCropSchema } = require('../validators/crop.validator');

const router = express.Router();

// Require authentication for all farm & crop routes
router.use(authenticate);

// Farm CRUD Routes
router.post('/', validate(createFarmSchema), farmController.createFarm);
router.get('/', validate(paginationQuerySchema, 'query'), farmController.getFarmerFarms);
router.get('/:farmId', farmController.getFarmById);
router.put('/:farmId', validate(updateFarmSchema), farmController.updateFarm);
router.delete('/:farmId', farmController.deleteFarm);

// Nested Crop Routes under Farm
router.post('/:farmId/crops', validate(createCropSchema), cropController.createCrop);
router.get('/:farmId/crops', validate(paginationQuerySchema, 'query'), cropController.getCropsByFarm);

module.exports = router;
