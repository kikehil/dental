const prisma = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/config');
const { formatCurrency } = require('../utils/helpers');

// Mostrar dashboard
const index = async (req, res) => {
  try {
    const today = moment().tz(config.timezone).startOf('day').toDate();
    const tomorrow = moment().tz(config.timezone).endOf('day').toDate();

    // KPIs
    const [
      citasHoy,
      ventasHoy,
      totalPacientes,
      doctoresActivos,
      proximasCitas,
      ventasRecientes,
    ] = await Promise.all([
      // Citas de hoy
      prisma.cita.count({
        where: {
          fecha: { gte: today, lte: tomorrow },
          estado: 'programada',
        },
      }),
      // Ventas de hoy
      prisma.venta.aggregate({
        where: {
          createdAt: { gte: today, lte: tomorrow },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Total pacientes
      prisma.paciente.count({ where: { activo: true } }),
      // Doctores activos
      prisma.doctor.count({ where: { activo: true } }),
      // Próximas citas de hoy
      prisma.cita.findMany({
        where: {
          fecha: { gte: today, lte: tomorrow },
          estado: 'programada',
        },
        include: {
          paciente: true,
          doctor: true,
        },
        orderBy: { horaInicio: 'asc' },
        take: 5,
      }),
      // Ventas recientes
      prisma.venta.findMany({
        include: { paciente: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Citas por doctor para el gráfico
    const citasPorDoctor = await prisma.doctor.findMany({
      where: { activo: true },
      include: {
        _count: {
          select: {
            citas: {
              where: {
                fecha: { gte: today, lte: tomorrow },
              },
            },
          },
        },
      },
    });

    res.render('dashboard/index', {
      title: 'Dashboard',
      kpis: {
        citasHoy,
        ventasHoy: {
          cantidad: ventasHoy._count,
          monto: formatCurrency(ventasHoy._sum.total || 0),
        },
        totalPacientes,
        doctoresActivos,
      },
      proximasCitas,
      ventasRecientes,
      citasPorDoctor: citasPorDoctor.map(d => ({
        nombre: `${d.nombre} ${d.apellido}`,
        color: d.color,
        citas: d._count.citas,
      })),
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error al cargar el dashboard',
      error,
    });
  }
};

module.exports = { index };

