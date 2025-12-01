const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { isAuthenticated } = require('../middleware/auth');

// Vistas
router.get('/', isAuthenticated, citasController.calendario);
router.get('/crear', isAuthenticated, citasController.create);
router.post('/crear', isAuthenticated, citasController.store);

// API
router.get('/api/eventos', isAuthenticated, citasController.getEvents);
router.post('/api/:id/estado', isAuthenticated, citasController.updateStatus);
router.delete('/api/:id', isAuthenticated, citasController.destroy);

module.exports = router;

