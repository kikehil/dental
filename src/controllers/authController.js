const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/config');

// Mostrar página de login
const showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión',
    error: null,
  });
};

// Procesar login
const processLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { doctor: true },
    });

    if (!usuario) {
      return res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: 'Credenciales incorrectas',
      });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, usuario.password);
    if (!isValid) {
      return res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: 'Credenciales incorrectas',
      });
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: 'Tu cuenta está desactivada',
      });
    }

    // Crear sesión
    req.session.user = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      doctorId: usuario.doctorId,
    };

    // Verificar si es admin o recepcionista y si necesita saldo inicial
    // Solo para admin y recepcionista, verificar si es el primer inicio del día
    if ((usuario.rol === 'admin' || usuario.rol === 'recepcionista')) {
      const hoy = moment().tz(config.timezone).startOf('day').toDate();
      const mañana = moment().tz(config.timezone).endOf('day').toDate();
      const ayer = moment().tz(config.timezone).subtract(1, 'day').startOf('day').toDate();
      const finAyer = moment().tz(config.timezone).subtract(1, 'day').endOf('day').toDate();
      
      // Verificar si hay saldo inicial hoy
      const saldoInicialHoy = await prisma.corteCaja.findFirst({
        where: {
          fecha: { gte: hoy, lte: mañana },
          hora: { equals: null }, // Saldo inicial no tiene hora
        },
      });

      // Verificar si ayer hubo algún corte (automático o manual)
      const corteAyer = await prisma.corteCaja.findFirst({
        where: {
          fecha: { gte: ayer, lte: finAyer },
          hora: { not: null }, // Cualquier corte con hora (automático o manual)
        },
        orderBy: { createdAt: 'desc' },
      });

      // Si no hay saldo inicial hoy, necesita saldo inicial en estos casos:
      // 1. Si ayer hubo algún corte (automático o manual) - después de cualquier corte se necesita saldo inicial
      // 2. Si es el primer día y no hay saldo inicial
      if (!saldoInicialHoy) {
        return res.redirect('/pos?necesitaSaldoInicial=true');
      }
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en login:', error);
    res.render('auth/login', {
      title: 'Iniciar Sesión',
      error: 'Error al iniciar sesión',
    });
  }
};

// Cerrar sesión
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login');
  });
};

// Mostrar perfil
const showProfile = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.session.user.id },
      include: { doctor: true },
    });

    res.render('auth/perfil', {
      title: 'Mi Perfil',
      usuario,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.redirect('/dashboard');
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const { nombre, email, currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    // Si quiere cambiar contraseña
    if (newPassword) {
      const isValid = await bcrypt.compare(currentPassword, usuario.password);
      if (!isValid) {
        return res.redirect('/perfil?error=Contraseña actual incorrecta');
      }
    }

    // Actualizar datos
    const updateData = { nombre, email };
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
    });

    // Actualizar sesión
    req.session.user.nombre = nombre;
    req.session.user.email = email;

    res.redirect('/perfil?success=Perfil actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.redirect('/perfil?error=Error al actualizar perfil');
  }
};

module.exports = {
  showLogin,
  processLogin,
  logout,
  showProfile,
  updateProfile,
};

