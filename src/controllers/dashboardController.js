const prisma = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/config');
const { formatCurrency } = require('../utils/helpers');

// Mostrar dashboard - Redirige al punto de venta
const index = async (req, res) => {
  res.redirect('/pos');
};

module.exports = { index };

