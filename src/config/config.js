require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'clinica_dental_secret',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
  timezone: process.env.TZ || 'America/Mexico_City',
  
  // Configuración de la clínica
  clinica: {
    nombre: 'Clínica Dental Sonrisa Perfecta',
    direccion: 'Av. Principal #123, Col. Centro',
    telefono: '(555) 123-4567',
    email: 'contacto@clinicadental.com',
    horario: 'Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00',
  },
  
  // Roles del sistema
  roles: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    RECEPCIONISTA: 'recepcionista',
  },
  
  // Estados de citas
  estadosCita: {
    PROGRAMADA: 'programada',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
    NO_ASISTIO: 'no_asistio',
  },
  
  // Métodos de pago
  metodosPago: [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
    { value: 'transferencia', label: 'Transferencia Bancaria' },
  ],
};

