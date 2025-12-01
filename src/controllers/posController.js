const prisma = require('../config/database');
const { generateFolio, formatCurrency } = require('../utils/helpers');
const { notifyNewSale } = require('../utils/webhooks');

// Mostrar punto de venta
const index = async (req, res) => {
  try {
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
    const ventasList = await prisma.venta.findMany({
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
      take: 50,
    });

    res.render('pos/ventas', {
      title: 'Historial de Ventas',
      ventas: ventasList,
      formatCurrency,
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

module.exports = {
  index,
  processSale,
  ventas,
  servicios,
  saveServicio,
  productos,
  saveProducto,
  getVenta,
};

