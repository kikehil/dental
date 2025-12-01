const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Enviar webhook a n8n
const sendWebhook = async (eventType, data) => {
  if (!config.n8nWebhookUrl) {
    console.log('⚠️ Webhook URL no configurada');
    return null;
  }

  const payload = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    eventType,
    clinica: config.clinica.nombre,
    data,
  };

  try {
    const response = await axios.post(config.n8nWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log(`✅ Webhook enviado: ${eventType}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error enviando webhook: ${error.message}`);
    return null;
  }
};

// Webhook para nueva cita
const notifyNewAppointment = async (cita, paciente, doctor) => {
  return sendWebhook('NUEVA_CITA', {
    cita: {
      id: cita.id,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      motivo: cita.motivo,
      estado: cita.estado,
    },
    paciente: {
      id: paciente.id,
      nombre: `${paciente.nombre} ${paciente.apellido}`,
      telefono: paciente.telefono,
      email: paciente.email,
    },
    doctor: {
      id: doctor.id,
      nombre: `${doctor.nombre} ${doctor.apellido}`,
      especialidad: doctor.especialidad,
    },
  });
};

// Webhook para nueva venta
const notifyNewSale = async (venta, items, paciente = null) => {
  return sendWebhook('NUEVA_VENTA', {
    venta: {
      id: venta.id,
      folio: venta.folio,
      subtotal: venta.subtotal,
      descuento: venta.descuento,
      total: venta.total,
      metodoPago: venta.metodoPago,
    },
    items: items.map(item => ({
      tipo: item.tipo,
      nombre: item.servicio?.nombre || item.producto?.nombre,
      cantidad: item.cantidad,
      precioUnit: item.precioUnit,
      subtotal: item.subtotal,
    })),
    paciente: paciente ? {
      id: paciente.id,
      nombre: `${paciente.nombre} ${paciente.apellido}`,
    } : null,
  });
};

// Webhook para cita cancelada
const notifyCancelledAppointment = async (cita, paciente, doctor, motivo) => {
  return sendWebhook('CITA_CANCELADA', {
    cita: {
      id: cita.id,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
    },
    paciente: {
      nombre: `${paciente.nombre} ${paciente.apellido}`,
      telefono: paciente.telefono,
    },
    doctor: {
      nombre: `${doctor.nombre} ${doctor.apellido}`,
    },
    motivoCancelacion: motivo,
  });
};

module.exports = {
  sendWebhook,
  notifyNewAppointment,
  notifyNewSale,
  notifyCancelledAppointment,
};

