const prisma = require('../config/database');
const { calculateAge } = require('../utils/helpers');

// Listar pacientes
const index = async (req, res) => {
  try {
    const { search } = req.query;
    
    let where = { activo: true };
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { apellido: { contains: search } },
        { telefono: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const pacientes = await prisma.paciente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.render('pacientes/index', {
      title: 'Pacientes',
      pacientes,
      search: search || '',
      calculateAge,
    });
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar pacientes', error });
  }
};

// Mostrar formulario de crear
const create = (req, res) => {
  res.render('pacientes/crear', {
    title: 'Nuevo Paciente',
    paciente: null,
    error: null,
  });
};

// Guardar nuevo paciente
const store = async (req, res) => {
  try {
    const {
      nombre, apellido, fechaNacimiento, genero, telefono, email,
      direccion, ocupacion, contactoEmergencia, telefonoEmergencia,
      alergias, enfermedades, medicamentos, notas,
    } = req.body;

    const paciente = await prisma.paciente.create({
      data: {
        nombre,
        apellido,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        genero: genero || null,
        telefono,
        email: email || null,
        direccion: direccion || null,
        ocupacion: ocupacion || null,
        contactoEmergencia: contactoEmergencia || null,
        telefonoEmergencia: telefonoEmergencia || null,
        notas: notas || null,
        antecedentes: {
          create: {
            alergias: alergias || null,
            enfermedades: enfermedades || null,
            medicamentos: medicamentos || null,
          },
        },
      },
    });

    res.redirect(`/pacientes/${paciente.id}`);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.render('pacientes/crear', {
      title: 'Nuevo Paciente',
      paciente: req.body,
      error: 'Error al crear el paciente',
    });
  }
};

// Ver detalle de paciente
const show = async (req, res) => {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        antecedentes: true,
        citas: {
          include: { doctor: true },
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        consultas: {
          include: { doctor: true },
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        archivos: {
          orderBy: { createdAt: 'desc' },
        },
        ventas: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!paciente) {
      return res.redirect('/pacientes');
    }

    res.render('pacientes/ver', {
      title: `${paciente.nombre} ${paciente.apellido}`,
      paciente,
      calculateAge,
    });
  } catch (error) {
    console.error('Error al ver paciente:', error);
    res.redirect('/pacientes');
  }
};

// Mostrar formulario de editar
const edit = async (req, res) => {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { antecedentes: true },
    });

    if (!paciente) {
      return res.redirect('/pacientes');
    }

    res.render('pacientes/editar', {
      title: 'Editar Paciente',
      paciente,
      error: null,
    });
  } catch (error) {
    console.error('Error al cargar paciente:', error);
    res.redirect('/pacientes');
  }
};

// Actualizar paciente
const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nombre, apellido, fechaNacimiento, genero, telefono, email,
      direccion, ocupacion, contactoEmergencia, telefonoEmergencia,
      alergias, enfermedades, medicamentos, notas,
    } = req.body;

    await prisma.paciente.update({
      where: { id },
      data: {
        nombre,
        apellido,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        genero: genero || null,
        telefono,
        email: email || null,
        direccion: direccion || null,
        ocupacion: ocupacion || null,
        contactoEmergencia: contactoEmergencia || null,
        telefonoEmergencia: telefonoEmergencia || null,
        notas: notas || null,
      },
    });

    // Actualizar antecedentes
    await prisma.antecedenteMedico.upsert({
      where: { pacienteId: id },
      update: {
        alergias: alergias || null,
        enfermedades: enfermedades || null,
        medicamentos: medicamentos || null,
      },
      create: {
        pacienteId: id,
        alergias: alergias || null,
        enfermedades: enfermedades || null,
        medicamentos: medicamentos || null,
      },
    });

    res.redirect(`/pacientes/${id}`);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.redirect(`/pacientes/${req.params.id}/editar`);
  }
};

// Eliminar paciente (soft delete)
const destroy = async (req, res) => {
  try {
    await prisma.paciente.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false },
    });
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.redirect('/pacientes');
  }
};

// API: Buscar pacientes
const search = async (req, res) => {
  try {
    const { q } = req.query;
    
    const pacientes = await prisma.paciente.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: q } },
          { apellido: { contains: q } },
          { telefono: { contains: q } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
      },
      take: 10,
    });

    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: 'Error en búsqueda' });
  }
};

module.exports = {
  index,
  create,
  store,
  show,
  edit,
  update,
  destroy,
  search,
};

