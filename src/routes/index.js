const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const doctoresRoutes = require('./doctoresRoutes');
const pacientesRoutes = require('./pacientesRoutes');
const citasRoutes = require('./citasRoutes');
const posRoutes = require('./posRoutes');

// Ruta principal - redirige al dashboard o login
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Montar rutas
router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/doctores', doctoresRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/citas', citasRoutes);
router.use('/pos', posRoutes);

module.exports = router;

