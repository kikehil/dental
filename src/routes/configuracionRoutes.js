const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Configuración de cortes (solo admin)
router.get('/cortes', isAuthenticated, isAdmin, configuracionController.mostrarConfiguracionCortes);
router.post('/cortes', isAuthenticated, isAdmin, configuracionController.actualizarConfiguracionCortes);

module.exports = router;

