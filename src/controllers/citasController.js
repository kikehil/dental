const prisma = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/config');
const { notifyNewAppointment, notifyCancelledAppointment } = require('../utils/webhooks');

// Mostrar calendario de citas
const calendario = async (req, res) => {
  try {
    const doctores = await prisma.doctor.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    const consultorios = await prisma.consultorio.findMany({
      where: { activo: true },
    });

    res.render('citas/calendario', {
      title: 'Calendario de Citas',
      doctores,
      consultorios,
    });
  } catch (error) {
    console.error('Error al cargar calendario:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar calendario', error });
  }
};

// Mostrar formulario de crear cita
const create = async (req, res) => {
  try {
    const [doctores, consultorios, pacientes] = await Promise.all([
      prisma.doctor.findMany({ where: { activo: true } }),
      prisma.consultorio.findMany({ where: { activo: true } }),
      prisma.paciente.findMany({ where: { activo: true }, take: 100 }),
    ]);

    res.render('citas/crear', {
      title: 'Nueva Cita',
      doctores,
      consultorios,
      pacientes,
      fecha: req.query.fecha || moment().format('YYYY-MM-DD'),
      hora: req.query.hora || '09:00',
      doctorId: req.query.doctorId || '',
      error: null,
    });
  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.redirect('/citas');
  }
};

// Guardar nueva cita
const store = async (req, res) => {
  try {
    const { pacienteId, doctorId, consultorioId, fecha, horaInicio, horaFin, motivo } = req.body;

    // Verificar conflictos de horario
    const conflicto = await prisma.cita.findFirst({
      where: {
        doctorId: parseInt(doctorId),
        fecha: new Date(fecha),
        estado: 'programada',
        OR: [
          {
            AND: [
              { horaInicio: { lte: horaInicio } },
              { horaFin: { gt: horaInicio } },
            ],
          },
          {
            AND: [
              { horaInicio: { lt: horaFin } },
              { horaFin: { gte: horaFin } },
            ],
          },
        ],
      },
    });

    if (conflicto) {
      const [doctores, consultorios, pacientes] = await Promise.all([
        prisma.doctor.findMany({ where: { activo: true } }),
        prisma.consultorio.findMany({ where: { activo: true } }),
        prisma.paciente.findMany({ where: { activo: true } }),
      ]);

      return res.render('citas/crear', {
        title: 'Nueva Cita',
        doctores,
        consultorios,
        pacientes,
        fecha,
        hora: horaInicio,
        doctorId,
        error: 'Ya existe una cita en ese horario para este doctor',
      });
    }

    const cita = await prisma.cita.create({
      data: {
        pacienteId: parseInt(pacienteId),
        doctorId: parseInt(doctorId),
        consultorioId: consultorioId ? parseInt(consultorioId) : null,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        motivo: motivo || null,
        estado: 'programada',
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    // Enviar webhook
    await notifyNewAppointment(cita, cita.paciente, cita.doctor);

    res.redirect('/citas');
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.redirect('/citas/crear');
  }
};

// API: Obtener citas para el calendario
const getEvents = async (req, res) => {
  try {
    const { start, end, doctorId } = req.query;

    let where = {
      fecha: {
        gte: new Date(start),
        lte: new Date(end),
      },
    };

    if (doctorId && doctorId !== 'all') {
      where.doctorId = parseInt(doctorId);
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
      },
    });

    const events = citas.map(cita => {
      const fechaStr = moment(cita.fecha).format('YYYY-MM-DD');
      return {
        id: cita.id,
        title: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
        start: `${fechaStr}T${cita.horaInicio}`,
        end: `${fechaStr}T${cita.horaFin}`,
        color: cita.estado === 'cancelada' ? '#ef4444' : 
               cita.estado === 'completada' ? '#10b981' : cita.doctor.color,
        extendedProps: {
          paciente: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
          doctor: `${cita.doctor.nombre} ${cita.doctor.apellido}`,
          consultorio: cita.consultorio?.nombre || 'Sin asignar',
          motivo: cita.motivo,
          estado: cita.estado,
          telefono: cita.paciente.telefono,
        },
      };
    });

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// API: Actualizar estado de cita
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    const cita = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado, notas: motivo },
      include: { paciente: true, doctor: true },
    });

    // Si se cancela, enviar webhook
    if (estado === 'cancelada') {
      await notifyCancelledAppointment(cita, cita.paciente, cita.doctor, motivo);
    }

    res.json({ success: true, cita });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

// API: Eliminar cita
const destroy = async (req, res) => {
  try {
    await prisma.cita.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
};

module.exports = {
  calendario,
  create,
  store,
  getEvents,
  updateStatus,
  destroy,
};

