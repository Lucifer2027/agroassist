const farmRepository = require('../repositories/farm.repository');
const { NotFoundError, AuthorizationError } = require('../utils/apiError');

class FarmService {
  async createFarm(userId, farmData) {
    return farmRepository.create({
      ...farmData,
      user_id: userId
    });
  }

  async getFarmerFarms(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      farmRepository.findByUserIdPaginated(userId, limit, offset),
      farmRepository.countByUserId(userId)
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

  async getFarmById(userId, farmId, userRole = 'farmer') {
    const farm = await farmRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundError(`Farm not found with ID: ${farmId}`, 'FARM_NOT_FOUND');
    }

    if (String(farm.user_id) !== String(userId) && userRole !== 'admin') {
      throw new AuthorizationError('Forbidden: You do not own this farm', 'UNAUTHORIZED_FARM_ACCESS');
    }

    return farm;
  }

  async updateFarm(userId, farmId, updateData, userRole = 'farmer') {
    await this.getFarmById(userId, farmId, userRole);
    return farmRepository.update(farmId, updateData);
  }

  async deleteFarm(userId, farmId, userRole = 'farmer') {
    await this.getFarmById(userId, farmId, userRole);
    return farmRepository.delete(farmId);
  }
}

module.exports = new FarmService();
