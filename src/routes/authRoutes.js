const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

// Login
router.get('/login', isNotAuthenticated, authController.showLogin);
router.post('/login', isNotAuthenticated, authController.processLogin);

// Logout
router.get('/logout', authController.logout);

// Perfil
router.get('/perfil', isAuthenticated, authController.showProfile);
router.post('/perfil', isAuthenticated, authController.updateProfile);

module.exports = router;

