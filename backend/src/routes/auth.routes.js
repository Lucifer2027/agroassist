const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { strictRateLimiter } = require('../middleware/security.middleware');

const router = express.Router();

router.post('/register', strictRateLimiter, authController.register);
router.post('/login', strictRateLimiter, authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
