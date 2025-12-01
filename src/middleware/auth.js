const config = require('../config/config');

// Verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Verificar si el usuario NO está autenticado (para login)
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

// Verificar roles específicos
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    
    if (roles.includes(req.session.user.rol)) {
      return next();
    }
    
    res.status(403).render('error', {
      title: 'Acceso Denegado',
      message: 'No tienes permisos para acceder a esta sección',
      error: { status: 403 },
    });
  };
};

// Verificar si es administrador
const isAdmin = hasRole(config.roles.ADMIN);

// Verificar si es administrador o doctor
const isAdminOrDoctor = hasRole(config.roles.ADMIN, config.roles.DOCTOR);

// Verificar si puede gestionar pacientes (todos los roles)
const canManagePatients = hasRole(
  config.roles.ADMIN,
  config.roles.DOCTOR,
  config.roles.RECEPCIONISTA
);

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  hasRole,
  isAdmin,
  isAdminOrDoctor,
  canManagePatients,
};

