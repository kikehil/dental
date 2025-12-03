const prisma = require('../config/database');
const { generateRandomColor, getDayName } = require('../utils/helpers');

// Listar doctores
const index = async (req, res) => {
  try {
    const doctores = await prisma.doctor.findMany({
      include: {
        horarios: true,
      },
      orderBy: { nombre: 'asc' },
    });

    res.render('doctores/index', {
      title: 'Doctores',
      doctores,
    });
  } catch (error) {
    console.error('Error al listar doctores:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar doctores', error });
  }
};

// Mostrar formulario de crear
const create = (req, res) => {
  res.render('doctores/crear', {
    title: 'Nuevo Doctor',
    doctor: null,
    error: null,
  });
};

// Guardar nuevo doctor
const store = async (req, res) => {
  try {
    const { nombre, apellido, especialidad, telefono, email, color } = req.body;

    const doctor = await prisma.doctor.create({
      data: {
        nombre,
        apellido,
        especialidad,
        telefono,
        email: email || null,
        color: color || generateRandomColor(),
      },
    });

    // Crear horarios predeterminados (Lun-Vie 9:00-18:00)
    for (let dia = 1; dia <= 5; dia++) {
      await prisma.horarioDoctor.create({
        data: {
          doctorId: doctor.id,
          diaSemana: dia,
          horaInicio: '09:00',
          horaFin: '18:00',
        },
      });
    }

    res.redirect('/doctores');
  } catch (error) {
    console.error('Error al crear doctor:', error);
    res.render('doctores/crear', {
      title: 'Nuevo Doctor',
      doctor: req.body,
      error: 'Error al crear el doctor',
    });
  }
};

// Mostrar formulario de editar
const edit = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { horarios: true },
    });

    if (!doctor) {
      return res.redirect('/doctores');
    }

    res.render('doctores/editar', {
      title: 'Editar Doctor',
      doctor,
      getDayName,
      error: null,
    });
  } catch (error) {
    console.error('Error al cargar doctor:', error);
    res.redirect('/doctores');
  }
};

// Actualizar doctor
const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, apellido, especialidad, telefono, email, color, activo } = req.body;

    await prisma.doctor.update({
      where: { id },
      data: {
        nombre,
        apellido,
        especialidad,
        telefono,
        email: email || null,
        color,
        activo: activo === 'on',
      },
    });

    res.redirect('/doctores');
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    res.redirect(`/doctores/${req.params.id}/editar`);
  }
};

// Actualizar horarios
const updateSchedule = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const { horarios } = req.body;

    // Eliminar horarios existentes
    await prisma.horarioDoctor.deleteMany({ where: { doctorId } });

    // Crear nuevos horarios
    if (horarios && Array.isArray(horarios)) {
      for (const h of horarios) {
        if (h.activo) {
          await prisma.horarioDoctor.create({
            data: {
              doctorId,
              diaSemana: parseInt(h.dia),
              horaInicio: h.inicio,
              horaFin: h.fin,
            },
          });
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar horarios:', error);
    res.status(500).json({ error: 'Error al actualizar horarios' });
  }
};

// Eliminar doctor
const destroy = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Soft delete - solo desactivar
    await prisma.doctor.update({
      where: { id },
      data: { activo: false },
    });

    res.redirect('/doctores');
  } catch (error) {
    console.error('Error al eliminar doctor:', error);
    res.redirect('/doctores');
  }
};

// API: Obtener doctores activos
const getActive = async (req, res) => {
  try {
    const doctores = await prisma.doctor.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        color: true,
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(doctores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  updateSchedule,
  destroy,
  getActive,
};

