const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const config = require('../config/config');
const { generateFolio, formatCurrency } = require('../utils/helpers');
const { notifyNewSale } = require('../utils/webhooks');

// Función auxiliar para obtener el último corte de caja del día
const getUltimoCorteHoy = async () => {
  const hoy = moment().tz(config.timezone).startOf('day').toDate();
  const mañana = moment().tz(config.timezone).endOf('day').toDate();
  
  const ultimoCorte = await prisma.corteCaja.findFirst({
    where: {
      fecha: { gte: hoy, lte: mañana },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return ultimoCorte;
};

// Función auxiliar para verificar si necesita corte de caja
const necesitaCorte = async () => {
  const ahora = moment().tz(config.timezone);
  const hora = ahora.hour();
  const minutos = ahora.minute();
  
  // Obtener último corte de hoy
  const hoy = ahora.startOf('day').toDate();
  const mañana = ahora.endOf('day').toDate();
  const ultimoCorte = await prisma.corteCaja.findFirst({
    where: {
      fecha: { gte: hoy, lte: mañana },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Verificar si ya pasó la hora del corte y no se ha hecho
  const hora2pm = 14;
  const hora6pm = 18;
  
  // Si es después de las 2pm y antes de las 6pm, y no hay corte de 2pm
  if (hora >= hora2pm && hora < hora6pm) {
    const corte2pmExiste = ultimoCorte && ultimoCorte.hora === '14:00';
    if (!corte2pmExiste && (hora > hora2pm || (hora === hora2pm && minutos >= 0))) {
      return { necesita: true, hora: '14:00' };
    }
  }
  
  // Si es después de las 6pm, y no hay corte de 6pm
  if (hora >= hora6pm) {
    const corte6pmExiste = ultimoCorte && ultimoCorte.hora === '18:00';
    if (!corte6pmExiste) {
      return { necesita: true, hora: '18:00' };
    }
  }
  
  return { necesita: false, hora: null };
};

// Mostrar punto de venta
const index = async (req, res) => {
  try {
    const ultimoCorte = await getUltimoCorteHoy();
    const { necesita, hora } = await necesitaCorte();
    
    // Verificar si necesita saldo inicial
    // No hay corte hoy, o el último corte fue a las 6pm (fin del día)
    const necesitaSaldoInicial = !ultimoCorte || (ultimoCorte && ultimoCorte.hora === '18:00');
    
    // Si necesita corte y hay un corte previo, redirigir a la vista de corte
    if (necesita && ultimoCorte && ultimoCorte.hora !== hora) {
      return res.redirect(`/pos/corte?hora=${hora}`);
    }
    
    // Si necesita saldo inicial, mostrar modal
    if (necesitaSaldoInicial && !necesita) {
      const [servicios, productos, pacientes] = await Promise.all([
        prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
        prisma.producto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
        prisma.paciente.findMany({ where: { activo: true }, take: 100, orderBy: { nombre: 'asc' } }),
      ]);

      return res.render('pos/index', {
        title: 'Punto de Venta',
        servicios,
        productos,
        pacientes,
        formatCurrency,
        necesitaSaldoInicial: true,
        ultimoCorte: null,
      });
    }
    
    const [servicios, productos, pacientes] = await Promise.all([
      prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
      prisma.producto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
      prisma.paciente.findMany({ where: { activo: true }, take: 100, orderBy: { nombre: 'asc' } }),
    ]);

    res.render('pos/index', {
      title: 'Punto de Venta',
      servicios,
      productos,
      pacientes,
      formatCurrency,
      necesitaSaldoInicial: false,
    });
  } catch (error) {
    console.error('Error al cargar POS:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar punto de venta', error });
  }
};

// Procesar venta
const processSale = async (req, res) => {
  try {
    const { pacienteId, items, descuento, metodoPago, notas } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No hay items en la venta' });
    }

    // Calcular totales
    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      const itemSubtotal = parseFloat(item.precio) * parseInt(item.cantidad);
      subtotal += itemSubtotal;

      itemsData.push({
        tipo: item.tipo,
        servicioId: item.tipo === 'servicio' ? parseInt(item.id) : null,
        productoId: item.tipo === 'producto' ? parseInt(item.id) : null,
        cantidad: parseInt(item.cantidad),
        precioUnit: parseFloat(item.precio),
        subtotal: itemSubtotal,
      });

      // Actualizar stock si es producto
      if (item.tipo === 'producto') {
        await prisma.producto.update({
          where: { id: parseInt(item.id) },
          data: { stock: { decrement: parseInt(item.cantidad) } },
        });
      }
    }

    const descuentoAmount = parseFloat(descuento) || 0;
    const total = subtotal - descuentoAmount;

    // Crear venta
    const venta = await prisma.venta.create({
      data: {
        folio: generateFolio(),
        pacienteId: pacienteId ? parseInt(pacienteId) : null,
        subtotal,
        descuento: descuentoAmount,
        total,
        metodoPago: metodoPago || 'efectivo',
        notas: notas || null,
        items: { create: itemsData },
      },
      include: {
        items: {
          include: {
            servicio: true,
            producto: true,
          },
        },
        paciente: true,
      },
    });

    // Enviar webhook
    await notifyNewSale(venta, venta.items, venta.paciente);

    res.json({
      success: true,
      venta: {
        id: venta.id,
        folio: venta.folio,
        total: formatCurrency(venta.total),
      },
    });
  } catch (error) {
    console.error('Error al procesar venta:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
};

// Historial de ventas
const ventas = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    // Calcular inicio y fin del día
    const hoy = fecha ? new Date(fecha) : new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    // Obtener ventas (todas o filtradas por fecha)
    const whereClause = fecha ? {
      createdAt: { gte: inicioDia, lte: finDia }
    } : {};

    const ventasList = await prisma.venta.findMany({
      where: whereClause,
      include: {
        paciente: true,
        items: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Obtener resumen del día de HOY
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const ventasHoy = await prisma.venta.findMany({
      where: {
        createdAt: { gte: hoyInicio, lte: hoyFin }
      },
      select: {
        total: true,
        metodoPago: true,
      },
    });

    // Calcular estadísticas
    const totalHoy = ventasHoy.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const cantidadHoy = ventasHoy.length;
    const promedio = cantidadHoy > 0 ? totalHoy / cantidadHoy : 0;
    
    // Método más popular
    const metodos = {};
    ventasHoy.forEach(v => {
      metodos[v.metodoPago] = (metodos[v.metodoPago] || 0) + 1;
    });
    const metodoPopular = Object.keys(metodos).length > 0 
      ? Object.keys(metodos).reduce((a, b) => metodos[a] > metodos[b] ? a : b)
      : 'N/A';

    // Calcular estado de caja de la sesión actual
    const hoyCaja = moment().tz(config.timezone).startOf('day').toDate();
    const mañanaCaja = moment().tz(config.timezone).endOf('day').toDate();
    
    const saldoInicialDelDia = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoyCaja, lte: mañanaCaja },
        hora: null,
      },
    });
    
    const ultimoCorte = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoyCaja, lte: mañanaCaja },
        hora: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    let saldoInicial = 0;
    let ventasDesdeUltimoCorte = [];
    
    if (ultimoCorte) {
      saldoInicial = parseFloat(ultimoCorte.saldoFinal);
      const desdeUltimoCorte = ultimoCorte.createdAt;
      
      ventasDesdeUltimoCorte = await prisma.venta.findMany({
        where: {
          createdAt: { gte: desdeUltimoCorte },
        },
        select: {
          total: true,
          metodoPago: true,
        },
      });
    } else if (saldoInicialDelDia) {
      saldoInicial = parseFloat(saldoInicialDelDia.saldoInicial);
      const desdeSaldoInicial = saldoInicialDelDia.createdAt;
      
      ventasDesdeUltimoCorte = await prisma.venta.findMany({
        where: {
          createdAt: { gte: desdeSaldoInicial },
        },
        select: {
          total: true,
          metodoPago: true,
        },
      });
    } else {
      const hoyInicio = moment().tz(config.timezone).startOf('day').toDate();
      ventasDesdeUltimoCorte = await prisma.venta.findMany({
        where: {
          createdAt: { gte: hoyInicio },
        },
        select: {
          total: true,
          metodoPago: true,
        },
      });
    }
    
    const totalVentasSesion = ventasDesdeUltimoCorte.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasEfectivoSesion = ventasDesdeUltimoCorte
      .filter(v => v.metodoPago === 'efectivo')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTarjetaSesion = ventasDesdeUltimoCorte
      .filter(v => v.metodoPago === 'tarjeta')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTransferenciaSesion = ventasDesdeUltimoCorte
      .filter(v => v.metodoPago === 'transferencia')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    
    const saldoEsperado = saldoInicial + ventasEfectivoSesion;

    res.render('pos/ventas', {
      title: 'Historial de Ventas',
      ventas: ventasList,
      formatCurrency,
      resumen: {
        ventasHoy: cantidadHoy,
        totalHoy: formatCurrency(totalHoy),
        promedio: formatCurrency(promedio),
        metodoPopular: metodoPopular,
      },
      estadoCaja: {
        saldoInicial,
        totalVentas: totalVentasSesion,
        ventasEfectivo: ventasEfectivoSesion,
        ventasTarjeta: ventasTarjetaSesion,
        ventasTransferencia: ventasTransferenciaSesion,
        saldoEsperado,
        cantidadVentas: ventasDesdeUltimoCorte.length,
      },
    });
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar ventas', error });
  }
};

// Gestión de servicios
const servicios = async (req, res) => {
  try {
    const serviciosList = await prisma.servicio.findMany({
      orderBy: { nombre: 'asc' },
    });

    res.render('pos/servicios', {
      title: 'Gestión de Servicios',
      servicios: serviciosList,
      formatCurrency,
    });
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar servicios', error });
  }
};

// Crear/Actualizar servicio
const saveServicio = async (req, res) => {
  try {
    const { id, nombre, descripcion, precio, duracion, categoria, activo } = req.body;

    if (id) {
      await prisma.servicio.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          duracion: parseInt(duracion),
          categoria,
          activo: activo === 'true',
        },
      });
    } else {
      await prisma.servicio.create({
        data: {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          duracion: parseInt(duracion) || 30,
          categoria,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar servicio:', error);
    res.status(500).json({ error: 'Error al guardar servicio' });
  }
};

// Gestión de productos
const productos = async (req, res) => {
  try {
    const productosList = await prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
    });

    // Alertas de stock bajo
    const stockBajo = productosList.filter(p => p.stock <= p.stockMinimo && p.activo);

    res.render('pos/productos', {
      title: 'Gestión de Productos',
      productos: productosList,
      stockBajo,
      formatCurrency,
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar productos', error });
  }
};

// Crear/Actualizar producto
const saveProducto = async (req, res) => {
  try {
    const { id, nombre, descripcion, precio, costo, stock, stockMinimo, categoria, activo } = req.body;

    if (id) {
      await prisma.producto.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          costo: costo ? parseFloat(costo) : null,
          stock: parseInt(stock),
          stockMinimo: parseInt(stockMinimo),
          categoria,
          activo: activo === 'true',
        },
      });
    } else {
      await prisma.producto.create({
        data: {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          costo: costo ? parseFloat(costo) : null,
          stock: parseInt(stock) || 0,
          stockMinimo: parseInt(stockMinimo) || 5,
          categoria,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.status(500).json({ error: 'Error al guardar producto' });
  }
};

// Ver detalle de venta
const getVenta = async (req, res) => {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        paciente: true,
        items: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
    });

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(venta);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

// Guardar saldo inicial
const guardarSaldoInicial = async (req, res) => {
  try {
    const { saldoInicial } = req.body;
    
    // Validar que el saldo inicial sea un número válido
    const saldo = parseFloat(saldoInicial);
    if (isNaN(saldo) || saldo < 0) {
      return res.status(400).json({ error: 'Saldo inicial inválido. Debe ser un número mayor o igual a 0' });
    }

    // Verificar si ya existe un corte hoy sin saldo inicial (no debería pasar)
    const hoy = moment().tz(config.timezone).startOf('day').toDate();
    const mañana = moment().tz(config.timezone).endOf('day').toDate();
    
    const corteExistente = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { is: null }, // Saldo inicial no tiene hora específica
      },
    });

    if (corteExistente) {
      return res.status(400).json({ error: 'Ya se registró un saldo inicial hoy' });
    }

    // Crear registro de saldo inicial (sin hora específica)
    // Proporcionar todos los campos requeridos explícitamente
    await prisma.corteCaja.create({
      data: {
        fecha: new Date(),
        hora: null,
        saldoInicial: saldo,
        saldoFinal: saldo,
        ventasEfectivo: 0,
        ventasTarjeta: 0,
        ventasTransferencia: 0,
        totalVentas: 0,
        diferencia: 0,
        usuarioId: req.session.user?.id || null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar saldo inicial:', error);
    // Mostrar mensaje de error más específico
    let mensajeError = 'Error al guardar saldo inicial';
    
    // Mensajes de error más específicos según el tipo de error
    if (error.code === 'P2002') {
      mensajeError = 'Ya existe un registro con estos datos';
    } else if (error.code === 'P2003') {
      mensajeError = 'Error de referencia en la base de datos';
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    res.status(500).json({ error: mensajeError });
  }
};

// Mostrar vista de corte de caja
const mostrarCorte = async (req, res) => {
  try {
    const { hora } = req.query;
    
    if (hora !== '14:00' && hora !== '18:00') {
      return res.redirect('/pos');
    }

    const hoy = moment().tz(config.timezone).startOf('day').toDate();
    const mañana = moment().tz(config.timezone).endOf('day').toDate();
    
    // Buscar el saldo inicial del día o el último corte
    const saldoInicialDelDia = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { is: null },
      },
    });
    
    const ultimoCorte = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Determinar desde cuándo contar las ventas
    let desdeFecha;
    let saldoInicial;
    
    if (ultimoCorte) {
      desdeFecha = ultimoCorte.createdAt;
      saldoInicial = parseFloat(ultimoCorte.saldoFinal);
    } else if (saldoInicialDelDia) {
      desdeFecha = saldoInicialDelDia.createdAt;
      saldoInicial = parseFloat(saldoInicialDelDia.saldoInicial);
    } else {
      // No hay saldo inicial ni cortes, usar inicio del día
      desdeFecha = hoy;
      saldoInicial = 0;
    }

    // Obtener ventas desde el último corte o saldo inicial
    const ventas = await prisma.venta.findMany({
      where: {
        createdAt: { gte: desdeFecha },
      },
      include: {
        paciente: true,
        items: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calcular totales
    const ventasEfectivo = ventas
      .filter(v => v.metodoPago === 'efectivo')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTarjeta = ventas
      .filter(v => v.metodoPago === 'tarjeta')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTransferencia = ventas
      .filter(v => v.metodoPago === 'transferencia')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const saldoEsperado = saldoInicial + ventasEfectivo;

    res.render('pos/corte', {
      title: `Corte de Caja - ${hora}`,
      hora,
      ultimoCorte: ultimoCorte || saldoInicialDelDia,
      ventas,
      formatCurrency,
      resumen: {
        saldoInicial,
        ventasEfectivo,
        ventasTarjeta,
        ventasTransferencia,
        totalVentas,
        saldoEsperado,
        cantidadVentas: ventas.length,
      },
    });
  } catch (error) {
    console.error('Error al mostrar corte:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar corte de caja', error });
  }
};

// Procesar corte de caja
const procesarCorte = async (req, res) => {
  try {
    const { hora, saldoFinal, observaciones } = req.body;
    
    if (hora !== '14:00' && hora !== '18:00') {
      return res.status(400).json({ error: 'Hora de corte inválida' });
    }

    const hoy = moment().tz(config.timezone).startOf('day').toDate();
    const mañana = moment().tz(config.timezone).endOf('day').toDate();
    
    // Verificar si ya existe un corte a esta hora
    const corteExistente = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: hora,
      },
    });

    if (corteExistente) {
      return res.status(400).json({ error: 'Ya se realizó el corte a esta hora' });
    }

    // Buscar el saldo inicial del día o el último corte
    const saldoInicialDelDia = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { is: null },
      },
    });
    
    const ultimoCorte = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Determinar desde cuándo contar las ventas y el saldo inicial
    let desdeFecha;
    let saldoInicial;
    
    if (ultimoCorte) {
      desdeFecha = ultimoCorte.createdAt;
      saldoInicial = parseFloat(ultimoCorte.saldoFinal);
    } else if (saldoInicialDelDia) {
      desdeFecha = saldoInicialDelDia.createdAt;
      saldoInicial = parseFloat(saldoInicialDelDia.saldoInicial);
    } else {
      return res.status(400).json({ error: 'No se encontró el saldo inicial del día' });
    }

    // Obtener ventas desde el último corte o saldo inicial
    const ventas = await prisma.venta.findMany({
      where: {
        createdAt: { gte: desdeFecha },
      },
      select: {
        total: true,
        metodoPago: true,
      },
    });

    // Calcular totales (saldoInicial ya fue asignado arriba)
    const ventasEfectivo = ventas
      .filter(v => v.metodoPago === 'efectivo')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTarjeta = ventas
      .filter(v => v.metodoPago === 'tarjeta')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTransferencia = ventas
      .filter(v => v.metodoPago === 'transferencia')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    
    const saldoFinalCalculado = parseFloat(saldoFinal);
    const diferencia = saldoFinalCalculado - (saldoInicial + ventasEfectivo);

    // Crear corte de caja
    await prisma.corteCaja.create({
      data: {
        fecha: new Date(),
        hora: hora,
        saldoInicial: saldoInicial,
        ventasEfectivo: ventasEfectivo,
        ventasTarjeta: ventasTarjeta,
        ventasTransferencia: ventasTransferencia,
        totalVentas: totalVentas,
        saldoFinal: saldoFinalCalculado,
        diferencia: diferencia,
        observaciones: observaciones || null,
        usuarioId: req.session.user?.id || null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al procesar corte:', error);
    res.status(500).json({ error: 'Error al procesar corte de caja' });
  }
};

// Verificar contraseña de administrador
const verificarPasswordAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    // Buscar usuario administrador
    const admin = await prisma.usuario.findFirst({
      where: {
        rol: 'admin',
        activo: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'No se encontró un administrador activo' });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, admin.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    res.status(500).json({ error: 'Error al verificar contraseña' });
  }
};

// Mostrar vista de corte manual
const mostrarCorteManual = async (req, res) => {
  try {
    const hoy = moment().tz(config.timezone).startOf('day').toDate();
    const mañana = moment().tz(config.timezone).endOf('day').toDate();
    
    // Buscar el saldo inicial del día o el último corte
    const saldoInicialDelDia = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { is: null },
      },
    });
    
    const ultimoCorte = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Determinar desde cuándo contar las ventas
    let desdeFecha;
    let saldoInicial;
    
    if (ultimoCorte) {
      desdeFecha = ultimoCorte.createdAt;
      saldoInicial = parseFloat(ultimoCorte.saldoFinal);
    } else if (saldoInicialDelDia) {
      desdeFecha = saldoInicialDelDia.createdAt;
      saldoInicial = parseFloat(saldoInicialDelDia.saldoInicial);
    } else {
      desdeFecha = hoy;
      saldoInicial = 0;
    }

    // Obtener ventas desde el último corte o saldo inicial
    const ventas = await prisma.venta.findMany({
      where: {
        createdAt: { gte: desdeFecha },
      },
      include: {
        paciente: true,
        items: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calcular totales
    const ventasEfectivo = ventas
      .filter(v => v.metodoPago === 'efectivo')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTarjeta = ventas
      .filter(v => v.metodoPago === 'tarjeta')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTransferencia = ventas
      .filter(v => v.metodoPago === 'transferencia')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const saldoEsperado = saldoInicial + ventasEfectivo;

    // Obtener hora actual para el corte manual
    const horaActual = moment().tz(config.timezone).format('HH:mm');

    res.render('pos/corte', {
      title: 'Corte Manual de Caja',
      hora: horaActual,
      esManual: true,
      ultimoCorte: ultimoCorte || saldoInicialDelDia,
      ventas,
      formatCurrency,
      resumen: {
        saldoInicial,
        ventasEfectivo,
        ventasTarjeta,
        ventasTransferencia,
        totalVentas,
        saldoEsperado,
        cantidadVentas: ventas.length,
      },
    });
  } catch (error) {
    console.error('Error al mostrar corte manual:', error);
    res.render('error', { title: 'Error', message: 'Error al cargar corte de caja', error });
  }
};

// Procesar corte manual
const procesarCorteManual = async (req, res) => {
  try {
    const { hora, saldoFinal, observaciones } = req.body;
    
    if (!hora) {
      return res.status(400).json({ error: 'Hora requerida' });
    }

    const hoy = moment().tz(config.timezone).startOf('day').toDate();
    const mañana = moment().tz(config.timezone).endOf('day').toDate();
    
    // Buscar el saldo inicial del día o el último corte
    const saldoInicialDelDia = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { is: null },
      },
    });
    
    const ultimoCorte = await prisma.corteCaja.findFirst({
      where: {
        fecha: { gte: hoy, lte: mañana },
        hora: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Determinar desde cuándo contar las ventas y el saldo inicial
    let desdeFecha;
    let saldoInicial;
    
    if (ultimoCorte) {
      desdeFecha = ultimoCorte.createdAt;
      saldoInicial = parseFloat(ultimoCorte.saldoFinal);
    } else if (saldoInicialDelDia) {
      desdeFecha = saldoInicialDelDia.createdAt;
      saldoInicial = parseFloat(saldoInicialDelDia.saldoInicial);
    } else {
      return res.status(400).json({ error: 'No se encontró el saldo inicial del día' });
    }

    // Obtener ventas desde el último corte o saldo inicial
    const ventas = await prisma.venta.findMany({
      where: {
        createdAt: { gte: desdeFecha },
      },
      select: {
        total: true,
        metodoPago: true,
      },
    });

    // Calcular totales
    const ventasEfectivo = ventas
      .filter(v => v.metodoPago === 'efectivo')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTarjeta = ventas
      .filter(v => v.metodoPago === 'tarjeta')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const ventasTransferencia = ventas
      .filter(v => v.metodoPago === 'transferencia')
      .reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    
    const saldoFinalCalculado = parseFloat(saldoFinal);
    const diferencia = saldoFinalCalculado - (saldoInicial + ventasEfectivo);

    // Crear corte de caja manual (hora personalizada)
    await prisma.corteCaja.create({
      data: {
        fecha: new Date(),
        hora: hora, // Hora manual
        saldoInicial: saldoInicial,
        ventasEfectivo: ventasEfectivo,
        ventasTarjeta: ventasTarjeta,
        ventasTransferencia: ventasTransferencia,
        totalVentas: totalVentas,
        saldoFinal: saldoFinalCalculado,
        diferencia: diferencia,
        observaciones: observaciones || null,
        usuarioId: req.session.user?.id || null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al procesar corte manual:', error);
    res.status(500).json({ error: 'Error al procesar corte de caja' });
  }
};

module.exports = {
  index,
  processSale,
  ventas,
  servicios,
  saveServicio,
  productos,
  saveProducto,
  getVenta,
  guardarSaldoInicial,
  mostrarCorte,
  procesarCorte,
  verificarPasswordAdmin,
  mostrarCorteManual,
  procesarCorteManual,
};

