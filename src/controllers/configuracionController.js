const prisma = require('../config/database');

// Mostrar página de configuración de cortes
const mostrarConfiguracionCortes = async (req, res) => {
  try {
    let configCortes = await prisma.configuracionCortes.findFirst({
      where: { activo: true },
    });
    
    // Si no existe configuración, crear una con valores por defecto
    if (!configCortes) {
      configCortes = await prisma.configuracionCortes.create({
        data: {
          horaCorte1: '14:00',
          horaCorte2: '18:00',
          activo: true,
        },
      });
    }
    
    res.render('configuracion/cortes', {
      title: 'Configuración de Cortes de Caja',
      configCortes,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error('Error al cargar configuración de cortes:', error);
    res.render('error', { 
      title: 'Error', 
      message: 'Error al cargar configuración de cortes', 
      error 
    });
  }
};

// Actualizar configuración de cortes
const actualizarConfiguracionCortes = async (req, res) => {
  try {
    const { horaCorte1, horaCorte2 } = req.body;
    
    // Validar formato de horas (HH:MM)
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(horaCorte1) || !horaRegex.test(horaCorte2)) {
      return res.redirect('/configuracion/cortes?error=Formato de hora inválido. Use HH:MM (ejemplo: 14:00)');
    }
    
    // Validar que horaCorte1 sea menor que horaCorte2
    const [h1, m1] = horaCorte1.split(':').map(Number);
    const [h2, m2] = horaCorte2.split(':').map(Number);
    const minutos1 = h1 * 60 + m1;
    const minutos2 = h2 * 60 + m2;
    
    if (minutos1 >= minutos2) {
      return res.redirect('/configuracion/cortes?error=El primer corte debe ser antes del segundo corte');
    }
    
    // Desactivar todas las configuraciones anteriores
    await prisma.configuracionCortes.updateMany({
      where: { activo: true },
      data: { activo: false },
    });
    
    // Crear nueva configuración activa
    await prisma.configuracionCortes.create({
      data: {
        horaCorte1,
        horaCorte2,
        activo: true,
      },
    });
    
    res.redirect('/configuracion/cortes?success=Configuración actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar configuración de cortes:', error);
    res.redirect('/configuracion/cortes?error=Error al actualizar la configuración');
  }
};

module.exports = {
  mostrarConfiguracionCortes,
  actualizarConfiguracionCortes,
};

