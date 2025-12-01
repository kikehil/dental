const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { isAuthenticated } = require('../middleware/auth');

// Punto de venta
router.get('/', isAuthenticated, posController.index);
router.post('/venta', isAuthenticated, posController.processSale);

// Historial
router.get('/ventas', isAuthenticated, posController.ventas);
router.get('/ventas/:id', isAuthenticated, posController.getVenta);

// Servicios
router.get('/servicios', isAuthenticated, posController.servicios);
router.post('/servicios', isAuthenticated, posController.saveServicio);

// Productos
router.get('/productos', isAuthenticated, posController.productos);
router.post('/productos', isAuthenticated, posController.saveProducto);

module.exports = router;

