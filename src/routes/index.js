const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const doctoresRoutes = require('./doctoresRoutes');
const pacientesRoutes = require('./pacientesRoutes');
const posRoutes = require('./posRoutes');

// Ruta principal - redirige al punto de venta o login
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/pos');
  } else {
    res.redirect('/login');
  }
});

// Montar rutas
router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/doctores', doctoresRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/pos', posRoutes);

module.exports = router;

