# 📖 Guía de Instalación Detallada

Esta guía te ayudará a instalar y configurar el Sistema de Clínica Dental en tu servidor local o remoto.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Software Requerido
- **Node.js** 18 o superior ([Descargar](https://nodejs.org/))
- **MySQL** 8 o superior ([Descargar](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Descargar](https://git-scm.com/))

### Verificar Instalación
```bash
node --version   # Debe mostrar v18.x.x o superior
npm --version    # Debe mostrar 9.x.x o superior
mysql --version  # Debe mostrar 8.x.x o superior
```

## 🚀 Instalación Rápida (Windows)

1. **Abre PowerShell o CMD en la carpeta del proyecto**

2. **Ejecuta el script de instalación**:
```batch
install.bat
```

3. El script automáticamente:
   - ✅ Verificará las dependencias
   - ✅ Instalará paquetes de Node.js
   - ✅ Configurará la base de datos
   - ✅ Creará datos de prueba
   - ✅ Compilará los estilos

4. **Inicia el servidor**:
```batch
npm start
```

## 🐧 Instalación Rápida (Linux/Mac)

1. **Dale permisos de ejecución al script**:
```bash
chmod +x install.sh
```

2. **Ejecuta el script**:
```bash
./install.sh
```

3. **Inicia el servidor**:
```bash
npm start
```

## 🔧 Instalación Manual Paso a Paso

### Paso 1: Clonar el Repositorio
```bash
git clone <tu-repositorio>
cd denal
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
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

# Configuración de Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Importante**: Cambia los valores según tu configuración:
- `DATABASE_URL`: Ajusta usuario, contraseña, host y puerto de MySQL
- `SESSION_SECRET`: Usa una cadena aleatoria larga en producción
- `N8N_WEBHOOK_URL`: URL de tu instancia de n8n (opcional)

### Paso 4: Crear la Base de Datos

Abre MySQL y ejecuta:

```sql
CREATE DATABASE clinica_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O desde la terminal:

```bash
mysql -u root -p -e "CREATE DATABASE clinica_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Paso 5: Ejecutar Migraciones

```bash
npx prisma generate
npx prisma migrate deploy
```

### Paso 6: Poblar con Datos de Prueba (Opcional)

```bash
node prisma/seed.js
```

Esto creará:
- ✅ 3 usuarios (admin, doctor, recepcionista)
- ✅ 3 doctores con especialidades
- ✅ 3 consultorios
- ✅ 8 pacientes de ejemplo
- ✅ 6 servicios dentales
- ✅ 5 productos
- ✅ 3 citas de ejemplo

### Paso 7: Compilar CSS de Tailwind

```bash
npm run build
```

### Paso 8: Iniciar el Servidor

**Modo desarrollo** (con auto-reload):
```bash
npm run dev
```

**Modo producción**:
```bash
npm start
```

El sistema estará disponible en: **http://localhost:3000**

## 👥 Acceso al Sistema

Después de la instalación, puedes acceder con estos usuarios de prueba:

| Rol | Email | Contraseña | Permisos |
|-----|-------|-----------|----------|
| **Administrador** | admin@clinica.com | admin123 | Acceso total |
| **Doctor** | doctor@clinica.com | doctor123 | Pacientes, citas, consultas |
| **Recepcionista** | recepcion@clinica.com | recepcion123 | Citas, ventas |

## 🔍 Verificar la Instalación

### 1. Verificar Base de Datos
```bash
npx prisma studio
```
Esto abrirá un navegador con una interfaz para ver tus datos.

### 2. Verificar Logs del Servidor
Al iniciar el servidor deberías ver:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🦷 SISTEMA DE CLÍNICA DENTAL MULTI-DOCTOR 🦷        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✅ Servidor iniciado en: http://localhost:3000
📅 Zona horaria: America/Mexico_City
🔗 Webhook n8n: [tu-url]
```

### 3. Verificar Compilación de CSS
El archivo `src/public/css/output.css` debe existir y tener contenido.

## ⚠️ Solución de Problemas

### Error: "Cannot connect to MySQL server"
**Solución**: 
- Verifica que MySQL esté corriendo
- Verifica las credenciales en el `.env`
- Asegúrate de que el puerto 3306 esté disponible

```bash
# Windows
net start MySQL80

# Linux/Mac
sudo service mysql start
```

### Error: "Prisma Client could not be generated"
**Solución**:
```bash
npx prisma generate --force
```

### Error: "Port 3000 is already in use"
**Solución**: Cambia el puerto en el `.env`:
```env
PORT=3001
```

### Error al compilar CSS
**Solución**:
```bash
# Reinstalar dependencias de desarrollo
npm install --save-dev tailwindcss
npm run build
```

### Problemas con permisos en Linux
**Solución**:
```bash
# Dar permisos a la carpeta uploads
mkdir -p uploads
chmod -R 755 uploads
```

## 🔄 Actualizar el Sistema

```bash
# Detener el servidor (Ctrl+C)

# Obtener últimos cambios
git pull

# Instalar nuevas dependencias
npm install

# Ejecutar nuevas migraciones
npx prisma migrate deploy

# Recompilar CSS
npm run build

# Reiniciar servidor
npm start
```

## 🗑️ Limpiar y Reinstalar

Si necesitas empezar de cero:

```bash
# Eliminar base de datos
mysql -u root -p -e "DROP DATABASE IF EXISTS clinica_dental;"

# Eliminar node_modules
rm -rf node_modules

# Eliminar archivos generados
rm -rf uploads
rm -rf prisma/migrations

# Reinstalar todo
npm install
```

Luego sigue los pasos de instalación manual desde el Paso 4.

## 📱 Configurar Webhooks n8n (Opcional)

1. **Crea un flujo en n8n** con un nodo Webhook

2. **Copia la URL del webhook**

3. **Actualiza el `.env`**:
```env
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/clinica-dental
```

4. **Reinicia el servidor**

El sistema enviará notificaciones automáticas cuando:
- Se cree una nueva cita
- Se procese una venta

## 🌐 Desplegar en Producción

Ver [README.md](README.md) para instrucciones de despliegue en servidor Linux con Apache o Nginx.

## 📞 Soporte

Si tienes problemas con la instalación:

1. Revisa esta guía completamente
2. Verifica los logs del servidor
3. Consulta la consola del navegador (F12) para errores
4. Verifica que todos los servicios estén corriendo

---

¡Listo! Tu Sistema de Clínica Dental debería estar funcionando correctamente.

