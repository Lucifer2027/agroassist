const cropRepository = require('../repositories/crop.repository');
const farmService = require('./farm.service');
const { NotFoundError } = require('../utils/apiError');

class CropService {
  async createCrop(userId, farmId, cropData, userRole = 'farmer') {
    // Verify farm exists and belongs to user
    await farmService.getFarmById(userId, farmId, userRole);

    return cropRepository.create({
      ...cropData,
      farm_id: farmId
    });
  }

  async getCropsByFarm(userId, farmId, page = 1, limit = 10, userRole = 'farmer') {
    // Verify farm ownership
    await farmService.getFarmById(userId, farmId, userRole);

    const offset = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      cropRepository.findByFarmIdPaginated(farmId, limit, offset),
      cropRepository.countByFarmId(farmId)
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages
      }
    };
  }

  async getCropById(userId, cropId, userRole = 'farmer') {
    const crop = await cropRepository.findById(cropId);
    if (!crop) {
      throw new NotFoundError(`Crop not found with ID: ${cropId}`, 'CROP_NOT_FOUND');
    }

    // Verify ownership of the parent farm
    await farmService.getFarmById(userId, crop.farm_id, userRole);

    return crop;
  }

  async updateCrop(userId, cropId, updateData, userRole = 'farmer') {
    await this.getCropById(userId, cropId, userRole);
    return cropRepository.update(cropId, updateData);
  }

  async deleteCrop(userId, cropId, userRole = 'farmer') {
    await this.getCropById(userId, cropId, userRole);
    return cropRepository.delete(cropId);
  }
}

module.exports = new CropService();
