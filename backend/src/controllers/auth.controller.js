const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      data: result,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

const forgotPassword = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Password reset instructions sent to your email.',
  });
};

const resetPassword = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Password reset successfully.',
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
};
