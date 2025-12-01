const moment = require('moment-timezone');
const config = require('../config/config');

// Formatear fecha en español
const formatDate = (date, format = 'DD/MM/YYYY') => {
  return moment(date).tz(config.timezone).format(format);
};

// Formatear fecha y hora
const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  return moment(date).tz(config.timezone).format(format);
};

// Formatear moneda MXN
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

// Generar folio único para ventas
const generateFolio = () => {
  const date = moment().tz(config.timezone).format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `V${date}-${random}`;
};

// Calcular edad a partir de fecha de nacimiento
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  return moment().diff(moment(birthDate), 'years');
};

// Obtener nombre del día de la semana
const getDayName = (dayNumber) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayNumber];
};

// Generar color aleatorio para doctores
const generateRandomColor = () => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Validar formato de hora HH:mm
const isValidTime = (time) => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

// Comparar horas
const compareTime = (time1, time2) => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  return minutes1 - minutes2;
};

// Sanitizar nombre de archivo
const sanitizeFileName = (fileName) => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
};

module.exports = {
  formatDate,
  formatDateTime,
  formatCurrency,
  generateFolio,
  calculateAge,
  getDayName,
  generateRandomColor,
  isValidTime,
  compareTime,
  sanitizeFileName,
};

