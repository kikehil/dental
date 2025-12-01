const express = require('express');
const router = express.Router();
const doctoresController = require('../controllers/doctoresController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Vistas
router.get('/', isAuthenticated, doctoresController.index);
router.get('/crear', isAuthenticated, isAdmin, doctoresController.create);
router.post('/crear', isAuthenticated, isAdmin, doctoresController.store);
router.get('/:id/editar', isAuthenticated, isAdmin, doctoresController.edit);
router.post('/:id/editar', isAuthenticated, isAdmin, doctoresController.update);
router.post('/:id/eliminar', isAuthenticated, isAdmin, doctoresController.destroy);

// API
router.get('/api/activos', isAuthenticated, doctoresController.getActive);
router.post('/:id/horarios', isAuthenticated, isAdmin, doctoresController.updateSchedule);

module.exports = router;

