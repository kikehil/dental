# 📖 Guía Completa de Instalación - Sistema Clínica Dental

## 🎯 Requisitos Previos

### 1. Instalar Node.js (REQUERIDO)

**Windows:**
1. Descarga Node.js desde: https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support)
3. Ejecuta el instalador `.msi`
4. Durante la instalación:
   - ✅ Acepta los términos de licencia
   - ✅ Deja la ruta de instalación por defecto
   - ✅ Marca la opción "Automatically install necessary tools"
5. Haz clic en "Finish"
6. **REINICIA** PowerShell/CMD

**Verificar instalación:**
```powershell
node --version
# Debería mostrar: v18.x.x o superior

npm --version
# Debería mostrar: 9.x.x o superior
```

### 2. Instalar MySQL (REQUERIDO)

**Windows:**
1. Descarga MySQL desde: https://dev.mysql.com/downloads/installer/
2. Descarga el instalador `mysql-installer-web-community`
3. Durante la instalación:
   - Selecciona "Developer Default"
   - Configura la contraseña de root: `Netbios85*`
   - Mantén el puerto: `3306`
   - Inicia el servicio de MySQL
4. Verifica que MySQL esté corriendo

**Verificar instalación:**
```powershell
mysql --version
# Debería mostrar: mysql Ver 8.x.x
```

---

## 🚀 Instalación del Sistema

### Opción A: Instalación Automática (RECOMENDADO)

1. **Abre PowerShell en la carpeta del proyecto**
   - Haz clic derecho en la carpeta `denal`
   - Selecciona "Abrir en Terminal" o "Abrir en PowerShell"

2. **Ejecuta el script de instalación:**
   ```powershell
   .\install.bat
   ```

3. **El script hará automáticamente:**
   - ✅ Instalará todas las dependencias de Node.js
   - ✅ Generará el cliente de Prisma
   - ✅ Creará las tablas en la base de datos
   - ✅ Insertará datos de prueba
   - ✅ Compilará el CSS de Tailwind

---

### Opción B: Instalación Manual Paso a Paso

#### Paso 1: Crear la Base de Datos

Abre MySQL y ejecuta:

```sql
CREATE DATABASE clinica_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O desde PowerShell:

```powershell
mysql -u root -p -e "CREATE DATABASE clinica_dental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# Cuando pida password, ingresa: Netbios85*
```

#### Paso 2: Instalar Dependencias de Node.js

```powershell
npm install
```

Esto instalará todos los paquetes necesarios:
- Express (servidor web)
- Prisma (ORM para base de datos)
- Tailwind CSS (estilos)
- Y más de 20 dependencias adicionales

⏱️ Este proceso puede tomar 2-5 minutos dependiendo de tu conexión a internet.

#### Paso 3: Generar Cliente de Prisma

```powershell
npx prisma generate
```

Esto crea el cliente de Prisma para interactuar con la base de datos.

#### Paso 4: Ejecutar Migraciones

```powershell
npx prisma migrate deploy
```

Esto creará todas las tablas necesarias en la base de datos:
- usuarios
- doctores
- pacientes
- citas
- servicios
- productos
- ventas
- Y más...

#### Paso 5: Poblar con Datos de Prueba

```powershell
node prisma/seed.js
```

Esto insertará:
- ✅ 3 usuarios (admin, doctor, recepcionista)
- ✅ 3 doctores con especialidades
- ✅ 3 consultorios
- ✅ 8 pacientes de ejemplo
- ✅ 6 servicios dentales
- ✅ 5 productos
- ✅ 3 citas de ejemplo

#### Paso 6: Compilar CSS

```powershell
npm run build
```

Esto compilará los estilos de Tailwind CSS.

---

## ▶️ Iniciar el Sistema

### Modo Desarrollo (con auto-reload)

```powershell
npm run dev
```

### Modo Producción

```powershell
npm start
```

El servidor se iniciará y verás:

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

---

## 🌐 Acceder al Sistema

1. **Abre tu navegador favorito** (Chrome, Edge, Firefox)

2. **Ve a:** http://localhost:3000

3. **Inicia sesión con:**

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Administrador** | admin@clinica.com | admin123 |
| **Doctor** | doctor@clinica.com | doctor123 |
| **Recepcionista** | recepcion@clinica.com | recepcion123 |

---

## ⚙️ Configuración Adicional

### Configurar Webhook de n8n (Opcional)

1. Abre el archivo `.env`
2. Localiza la línea: `N8N_WEBHOOK_URL=...`
3. Reemplaza con tu URL de n8n:
   ```
   N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/clinica-dental
   ```
4. Guarda el archivo
5. Reinicia el servidor

### Cambiar el Puerto del Servidor

Si el puerto 3000 ya está en uso:

1. Abre el archivo `.env`
2. Cambia: `PORT=3000` por el puerto que desees, ejemplo: `PORT=3001`
3. Guarda y reinicia el servidor

---

## ❌ Solución de Problemas

### Error: "npm no se reconoce como comando"

**Solución:** Node.js no está instalado o no está en el PATH
1. Instala Node.js desde https://nodejs.org/
2. Reinicia PowerShell/CMD
3. Verifica con: `node --version`

### Error: "Cannot connect to MySQL"

**Solución:** 
1. Verifica que MySQL esté corriendo:
   ```powershell
   # Inicia el servicio de MySQL
   net start MySQL80
   ```
2. Verifica las credenciales en el archivo `.env`
3. Asegúrate de que el puerto 3306 esté disponible

### Error: "prisma migrate failed"

**Solución:**
1. Verifica que la base de datos existe:
   ```sql
   SHOW DATABASES;
   ```
2. Si no existe, créala:
   ```sql
   CREATE DATABASE clinica_dental;
   ```
3. Vuelve a ejecutar: `npx prisma migrate deploy`

### Error: "Port 3000 is already in use"

**Solución:**
1. Cambia el puerto en `.env` a otro valor (ej: 3001)
2. O cierra la aplicación que usa el puerto 3000

### Error: "Module not found"

**Solución:**
```powershell
# Elimina node_modules y reinstala
Remove-Item -Recurse -Force node_modules
npm install
```

### Problemas con CSS (estilos no se ven)

**Solución:**
```powershell
# Recompila el CSS
npm run build
```

---

## 📊 Verificar que Todo Funciona

### 1. Verificar Base de Datos

```powershell
npx prisma studio
```

Esto abrirá una interfaz web para ver tus datos en: http://localhost:5555

### 2. Verificar Logs del Servidor

Al iniciar el servidor, deberías ver mensajes sin errores.

### 3. Verificar Funcionalidades

- ✅ Login funciona
- ✅ Dashboard muestra KPIs
- ✅ Puedes ver pacientes
- ✅ Puedes crear una cita
- ✅ El POS carga servicios y productos

---

## 🔄 Comandos Útiles

```powershell
# Ver todos los scripts disponibles
npm run

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Compilar CSS
npm run build

# Compilar CSS y observar cambios
npm run watch:css

# Ver base de datos (Prisma Studio)
npx prisma studio

# Reiniciar base de datos
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate
```

---

## 📁 Estructura de Archivos Importantes

```
denal/
├── .env                    ← Configuración (credenciales, puerto, etc.)
├── package.json            ← Dependencias del proyecto
├── prisma/
│   └── schema.prisma       ← Estructura de la base de datos
├── src/
│   ├── server.js           ← Archivo principal del servidor
│   ├── config/config.js    ← Configuraciones del sistema
│   └── views/              ← Vistas HTML del sistema
└── install.bat             ← Script de instalación automática
```

---

## 🎓 Próximos Pasos

Una vez que el sistema esté funcionando:

1. **Explora el Dashboard** - Familiarízate con la interfaz
2. **Crea tu primer paciente** - Ve a Pacientes > Nuevo Paciente
3. **Agenda una cita** - Ve a Citas > Nueva Cita
4. **Prueba el POS** - Ve a Punto de Venta y realiza una venta
5. **Revisa los reportes** - Explora las estadísticas en el Dashboard

---

## 📞 Soporte

Si sigues teniendo problemas:

1. Revisa los logs del servidor en la consola
2. Verifica que MySQL esté corriendo
3. Asegúrate de que todas las dependencias estén instaladas
4. Consulta el archivo `README.md` para más detalles

---

¡Listo! Tu Sistema de Clínica Dental debería estar funcionando correctamente. 🎉

