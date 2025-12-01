const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.ventaItem.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.consulta.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.archivoPaciente.deleteMany();
  await prisma.antecedenteMedico.deleteMany();
  await prisma.horarioDoctor.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.consultorio.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.producto.deleteMany();

  // Crear consultorios
  console.log('📍 Creando consultorios...');
  const consultorios = await Promise.all([
    prisma.consultorio.create({ data: { nombre: 'Consultorio 1', ubicacion: 'Planta baja' } }),
    prisma.consultorio.create({ data: { nombre: 'Consultorio 2', ubicacion: 'Planta baja' } }),
    prisma.consultorio.create({ data: { nombre: 'Consultorio 3', ubicacion: 'Primer piso' } }),
  ]);

  // Crear doctores
  console.log('👨‍⚕️ Creando doctores...');
  const doctores = await Promise.all([
    prisma.doctor.create({
      data: {
        nombre: 'Juan',
        apellido: 'Martínez García',
        especialidad: 'Ortodoncia',
        telefono: '555-0101',
        email: 'dr.martinez@clinica.com',
        color: '#3b82f6',
      },
    }),
    prisma.doctor.create({
      data: {
        nombre: 'Ana',
        apellido: 'López Hernández',
        especialidad: 'Endodoncia',
        telefono: '555-0102',
        email: 'dra.lopez@clinica.com',
        color: '#10b981',
      },
    }),
    prisma.doctor.create({
      data: {
        nombre: 'Carlos',
        apellido: 'Rodríguez Pérez',
        especialidad: 'Odontopediatría',
        telefono: '555-0103',
        email: 'dr.rodriguez@clinica.com',
        color: '#f59e0b',
      },
    }),
  ]);

  // Crear horarios para doctores
  console.log('📅 Creando horarios...');
  for (const doctor of doctores) {
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
  }

  // Crear usuarios
  console.log('👤 Creando usuarios...');
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordDoctor = await bcrypt.hash('doctor123', 10);
  const passwordRecepcion = await bcrypt.hash('recepcion123', 10);

  await prisma.usuario.create({
    data: {
      email: 'admin@clinica.com',
      password: passwordAdmin,
      nombre: 'Administrador',
      rol: 'admin',
    },
  });

  await prisma.usuario.create({
    data: {
      email: 'doctor@clinica.com',
      password: passwordDoctor,
      nombre: 'Dr. Juan Martínez',
      rol: 'doctor',
      doctorId: doctores[0].id,
    },
  });

  await prisma.usuario.create({
    data: {
      email: 'recepcion@clinica.com',
      password: passwordRecepcion,
      nombre: 'María García',
      rol: 'recepcionista',
    },
  });

  // Crear pacientes
  console.log('🧑 Creando pacientes...');
  const pacientes = await Promise.all([
    prisma.paciente.create({
      data: {
        nombre: 'Roberto',
        apellido: 'Sánchez Luna',
        fechaNacimiento: new Date('1985-03-15'),
        genero: 'masculino',
        telefono: '555-1001',
        email: 'roberto.sanchez@email.com',
        direccion: 'Av. Principal 123, Col. Centro',
        antecedentes: {
          create: {
            alergias: 'Penicilina',
            enfermedades: 'Ninguna',
            medicamentos: 'Ninguno',
          },
        },
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: 'Laura',
        apellido: 'Mendoza Ríos',
        fechaNacimiento: new Date('1990-07-22'),
        genero: 'femenino',
        telefono: '555-1002',
        email: 'laura.mendoza@email.com',
        direccion: 'Calle Roble 456, Col. Jardines',
        antecedentes: {
          create: {
            alergias: 'Ninguna conocida',
            enfermedades: 'Diabetes tipo 2',
            medicamentos: 'Metformina',
          },
        },
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: 'Miguel',
        apellido: 'Torres Vega',
        fechaNacimiento: new Date('1978-11-08'),
        genero: 'masculino',
        telefono: '555-1003',
        email: 'miguel.torres@email.com',
        direccion: 'Blvd. Las Palmas 789',
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: 'Carmen',
        apellido: 'Flores Morales',
        fechaNacimiento: new Date('1995-05-30'),
        genero: 'femenino',
        telefono: '555-1004',
        email: 'carmen.flores@email.com',
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: 'Pedro',
        apellido: 'Ramírez Cruz',
        fechaNacimiento: new Date('2010-09-12'),
        genero: 'masculino',
        telefono: '555-1005',
        contactoEmergencia: 'Ana Cruz (Madre)',
        telefonoEmergencia: '555-1006',
      },
    }),
  ]);

  // Crear servicios
  console.log('🦷 Creando servicios...');
  await Promise.all([
    prisma.servicio.create({
      data: {
        nombre: 'Limpieza Dental',
        descripcion: 'Limpieza dental profesional con ultrasonido',
        precio: 500.00,
        duracion: 45,
        categoria: 'Preventivo',
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Resina Dental',
        descripcion: 'Restauración con resina fotocurable',
        precio: 800.00,
        duracion: 60,
        categoria: 'Restaurativo',
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Extracción Simple',
        descripcion: 'Extracción de pieza dental sin complicaciones',
        precio: 600.00,
        duracion: 30,
        categoria: 'Cirugía',
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Consulta de Ortodoncia',
        descripcion: 'Evaluación y plan de tratamiento de ortodoncia',
        precio: 400.00,
        duracion: 45,
        categoria: 'Ortodoncia',
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Endodoncia',
        descripcion: 'Tratamiento de conductos',
        precio: 2500.00,
        duracion: 90,
        categoria: 'Endodoncia',
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Blanqueamiento Dental',
        descripcion: 'Blanqueamiento dental con luz LED',
        precio: 1800.00,
        duracion: 60,
        categoria: 'Estético',
      },
    }),
  ]);

  // Crear productos
  console.log('📦 Creando productos...');
  await Promise.all([
    prisma.producto.create({
      data: {
        nombre: 'Cepillo Dental Adulto',
        descripcion: 'Cepillo dental de cerdas suaves',
        precio: 85.00,
        costo: 35.00,
        stock: 50,
        stockMinimo: 10,
        categoria: 'Higiene',
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Pasta Dental 100ml',
        descripcion: 'Pasta dental con flúor',
        precio: 65.00,
        costo: 28.00,
        stock: 40,
        stockMinimo: 10,
        categoria: 'Higiene',
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Hilo Dental 50m',
        descripcion: 'Hilo dental encerado',
        precio: 55.00,
        costo: 22.00,
        stock: 30,
        stockMinimo: 8,
        categoria: 'Higiene',
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Enjuague Bucal 500ml',
        descripcion: 'Enjuague bucal antibacterial',
        precio: 120.00,
        costo: 55.00,
        stock: 25,
        stockMinimo: 5,
        categoria: 'Higiene',
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Kit Limpieza Infantil',
        descripcion: 'Kit con cepillo y pasta para niños',
        precio: 150.00,
        costo: 65.00,
        stock: 20,
        stockMinimo: 5,
        categoria: 'Infantil',
      },
    }),
  ]);

  // Crear citas de ejemplo
  console.log('📅 Creando citas de ejemplo...');
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  await Promise.all([
    prisma.cita.create({
      data: {
        pacienteId: pacientes[0].id,
        doctorId: doctores[0].id,
        consultorioId: consultorios[0].id,
        fecha: hoy,
        horaInicio: '10:00',
        horaFin: '10:45',
        motivo: 'Revisión de brackets',
        estado: 'programada',
      },
    }),
    prisma.cita.create({
      data: {
        pacienteId: pacientes[1].id,
        doctorId: doctores[1].id,
        consultorioId: consultorios[1].id,
        fecha: hoy,
        horaInicio: '11:00',
        horaFin: '12:30',
        motivo: 'Endodoncia molar inferior',
        estado: 'programada',
      },
    }),
    prisma.cita.create({
      data: {
        pacienteId: pacientes[4].id,
        doctorId: doctores[2].id,
        consultorioId: consultorios[2].id,
        fecha: manana,
        horaInicio: '09:00',
        horaFin: '09:45',
        motivo: 'Revisión periódica',
        estado: 'programada',
      },
    }),
  ]);

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('📋 Usuarios creados:');
  console.log('   - admin@clinica.com / admin123 (Administrador)');
  console.log('   - doctor@clinica.com / doctor123 (Doctor)');
  console.log('   - recepcion@clinica.com / recepcion123 (Recepcionista)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

