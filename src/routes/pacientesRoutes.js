const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { isAuthenticated } = require('../middleware/auth');

// Vistas
router.get('/', isAuthenticated, pacientesController.index);
router.get('/crear', isAuthenticated, pacientesController.create);
router.post('/crear', isAuthenticated, pacientesController.store);
router.get('/:id', isAuthenticated, pacientesController.show);
router.get('/:id/editar', isAuthenticated, pacientesController.edit);
router.post('/:id/editar', isAuthenticated, pacientesController.update);
router.post('/:id/eliminar', isAuthenticated, pacientesController.destroy);

// API
router.get('/api/buscar', isAuthenticated, pacientesController.search);

module.exports = router;

