# 🦷 Sistema de Gestión para Clínica Dental Multi-Doctor

Sistema web profesional, moderno y totalmente funcional para la gestión de una clínica dental con múltiples doctores. Desarrollado con Node.js, Express, Prisma y MySQL.

![Tecnologías](https://img.shields.io/badge/Node.js-18+-green)
![Base de Datos](https://img.shields.io/badge/MySQL-8+-blue)
![Framework](https://img.shields.io/badge/Express-4+-red)
![ORM](https://img.shields.io/badge/Prisma-5+-purple)

## ✨ Características Principales

### 🏥 Módulo de Autenticación y Roles
- ✅ Sistema de login/logout seguro
- ✅ 3 roles de usuario:
  - **Administrador**: Control total del sistema
  - **Doctor**: Gestión de pacientes y consultas
  - **Recepcionista/Caja**: Citas y ventas

### 🧑‍⚕️ Módulo de Doctores
- ✅ CRUD completo de doctores
- ✅ Especialidades configurables
- ✅ Gestión de horarios de atención
- ✅ Agenda personalizada por doctor
- ✅ Colores distintivos en calendario

### 🧑‍💼 Módulo de Pacientes
- ✅ CRUD completo de pacientes
- ✅ Datos completos del paciente
- ✅ Antecedentes médicos:
  - Alergias
  - Padecimientos
  - Medicamentos
- ✅ Historial clínico completo
- ✅ Adjuntar archivos (radiografías, fotos)
- ✅ Buscador inteligente

### 📅 Módulo de Citas Multi-Doctor
- ✅ Agenda por día, semana y mes
- ✅ Visualización de disponibilidad por doctor
- ✅ Crear, reprogramar y cancelar citas
- ✅ Selección de consultorio
- ✅ Generación automática de tickets
- ✅ **Webhook a n8n** con todos los datos de la cita
- ✅ Prevención de conflictos de horario

### 🧾 Módulo de Punto de Venta (POS)
- ✅ Catálogo de servicios dentales
- ✅ Catálogo de productos
- ✅ Control de inventario
- ✅ Carrito de compra
- ✅ Descuentos configurables
- ✅ Múltiples métodos de pago
- ✅ Tickets en PDF y formato térmico (80mm)
- ✅ **Webhook a n8n** con datos de venta

### 🎨 Diseño UI/UX
- ✅ Tailwind CSS en todo el proyecto
- ✅ Diseño responsive 100%
- ✅ Dashboard con KPIs en tiempo real
- ✅ Interfaz moderna y profesional
- ✅ Paleta de colores azul/verde

## 🚀 Instalación Rápida

### Requisitos Previos
- Node.js 18 o superior
- MySQL 8 o superior
- Git

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd denal
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
# Base de Datos MySQL
DATABASE_URL="mysql://root:Netbios85*@localhost:3306/clinica_dental"

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Secreto para sesiones (cambiar en producción)
SESSION_SECRET=mi_secreto_super_seguro_cambiar_en_produccion

# Webhook n8n (configurar tu URL de n8n)
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/clinica-dental

# Zona Horaria
TZ=America/Mexico_City
```

### 4. Crear la base de datos
```bash
# Crear la base de datos en MySQL
mysql -u root -p
CREATE DATABASE clinica_dental;
exit;
```

### 5. Ejecutar migraciones
```bash
npx prisma migrate dev
```

### 6. Generar cliente de Prisma
```bash
npx prisma generate
```

### 7. Poblar base de datos con datos de prueba
```bash
node prisma/seed.js
```

### 8. Compilar CSS de Tailwind
```bash
npm run build
```

### 9. Iniciar el servidor
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El sistema estará disponible en: **http://localhost:3000**

## 👥 Usuarios de Prueba

Después de ejecutar el seed, podrás acceder con:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Administrador** | admin@clinica.com | admin123 |
| **Doctor** | doctor@clinica.com | doctor123 |
| **Recepcionista** | recepcion@clinica.com | recepcion123 |

## 📁 Estructura del Proyecto

```
denal/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.js                # Datos de prueba
├── src/
│   ├── config/
│   │   ├── config.js          # Configuración general
│   │   └── database.js        # Cliente Prisma
│   ├── controllers/           # Controladores
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── doctoresController.js
│   │   ├── pacientesController.js
│   │   ├── citasController.js
│   │   └── posController.js
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticación
│   ├── routes/                # Rutas
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── doctoresRoutes.js
│   │   ├── pacientesRoutes.js
│   │   ├── citasRoutes.js
│   │   └── posRoutes.js
│   ├── utils/                 # Utilidades
│   │   ├── helpers.js
│   │   ├── webhooks.js        # Integración n8n
│   │   └── tickets.js         # Generación de tickets
│   ├── views/                 # Vistas EJS
│   │   ├── layout.ejs
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── doctores/
│   │   ├── pacientes/
│   │   ├── citas/
│   │   └── pos/
│   ├── public/                # Archivos estáticos
│   │   ├── css/
│   │   └── js/
│   └── server.js              # Servidor principal
├── uploads/                   # Archivos subidos
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
├── tailwind.config.js
└── README.md
```

## 🔔 Configuración de Webhooks n8n

El sistema envía automáticamente notificaciones a n8n en dos eventos:

### 1. Nueva Cita
```json
{
  "evento": "nueva_cita",
  "cita_id": 123,
  "paciente": "Juan Pérez",
  "telefono": "8331234567",
  "doctor": "Dra. Martínez",
  "fecha": "2025-01-10",
  "hora": "4:30 PM",
  "motivo": "Limpieza dental",
  "uuid": "xxxxxxxx-xxxx"
}
```

### 2. Venta Realizada
```json
{
  "evento": "venta_realizada",
  "venta_id": 456,
  "total": 890,
  "paciente": "Juan Pérez",
  "conceptos": [
    { "item": "Limpieza dental", "precio": 500 },
    { "item": "Cepillo dental", "precio": 120 }
  ],
  "fecha": "2025-01-10 16:45",
  "uuid": "xxxxxxxx-xxxx"
}
```

Para configurar n8n:
1. Crear un webhook en n8n
2. Copiar la URL del webhook
3. Actualizar `N8N_WEBHOOK_URL` en el archivo `.env`

## 🖨 Generación de Tickets

El sistema genera tickets en dos formatos:

- **PDF**: Para impresión en impresoras normales
- **Térmico**: Optimizado para impresoras térmicas de 80mm

Los tickets se generan automáticamente al:
- Crear una nueva cita
- Procesar una venta en el POS

## 🌐 Despliegue en Servidor Linux

### Con Apache

1. Instalar Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Clonar el proyecto:
```bash
cd /var/www
git clone <tu-repositorio> clinica-dental
cd clinica-dental
```

3. Instalar dependencias:
```bash
npm install
npm run build
```

4. Configurar PM2:
```bash
sudo npm install -g pm2
pm2 start src/server.js --name clinica-dental
pm2 save
pm2 startup
```

5. Configurar Apache como proxy inverso:
```apache
<VirtualHost *:80>
    ServerName tudominio.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

### Con Nginx

```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Scripts Disponibles

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Compilar CSS
npm run build

# Compilar CSS en modo watch
npm run watch:css

# Ejecutar migraciones
npm run prisma:migrate

# Generar cliente Prisma
npm run prisma:generate

# Abrir Prisma Studio
npm run prisma:studio

# Setup completo (instalación + migración + build)
npm run setup
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sesiones seguras con express-session
- ✅ Validación de datos en servidor
- ✅ Protección CSRF en formularios
- ✅ Sanitización de entradas
- ✅ Control de acceso basado en roles

## 🛠 Tecnologías Utilizadas

- **Backend**: Node.js + Express
- **Base de Datos**: MySQL
- **ORM**: Prisma
- **Motor de Plantillas**: EJS
- **CSS**: Tailwind CSS
- **Generación PDF**: PDFKit
- **Manejo de Archivos**: Multer
- **Fechas**: Moment.js con timezone
- **HTTP Client**: Axios (webhooks)
- **Validación**: Express Validator

## 📞 Soporte

Para soporte o consultas sobre el sistema, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado con ❤️ para Clínicas Dentales Profesionales**

# dental
# dental
