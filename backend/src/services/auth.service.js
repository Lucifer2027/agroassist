const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { env } = require('../config/env.config');
const ApiError = require('../utils/apiError');

class AuthService {
  async register(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw ApiError.badRequest('An account with this email address already exists.', 'AUTH_EMAIL_ALREADY_EXISTS');
    }

    const rawPassword = userData.password || userData.password_hash || userData.passwordHash || 'DefaultPassword123!';
    const password_hash = await bcrypt.hash(rawPassword, 10);
    
    let user;
    try {
      user = await userRepository.create({
        first_name: userData.first_name || userData.firstName || 'Farmer',
        last_name: userData.last_name || userData.lastName || 'User',
        email: userData.email,
        password_hash,
        phone: userData.phone || null,
        location: userData.location || null,
        role: 'farmer',
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062 || (err.message && err.message.includes('Duplicate entry'))) {
        throw ApiError.badRequest('An account with this email address already exists.', 'AUTH_EMAIL_ALREADY_EXISTS');
      }
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (user.password_hash) {
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
      }
    }

    const token = jwt.sign(
      { id: user.id, userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.', 'USER_NOT_FOUND');
    }
    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();
