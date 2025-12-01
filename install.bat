@echo off
echo ================================================
echo INSTALACION DEL SISTEMA DE CLINICA DENTAL
echo ================================================
echo.

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js instalado

echo.
echo [2/6] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)

echo.
echo [3/6] Generando cliente de Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: No se pudo generar el cliente de Prisma
    pause
    exit /b 1
)

echo.
echo [4/6] Creando base de datos y tablas...
echo IMPORTANTE: Asegurate de tener MySQL corriendo
echo y la base de datos 'clinica_dental' creada
echo.
pause

call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron ejecutar las migraciones
    echo Verifica que MySQL este corriendo y la base de datos exista
    pause
    exit /b 1
)

echo.
echo [5/6] Poblando base de datos con datos de prueba...
call node prisma/seed.js
if %errorlevel% neq 0 (
    echo ADVERTENCIA: No se pudieron insertar datos de prueba
    echo El sistema seguira funcionando pero sin datos iniciales
)

echo.
echo [6/6] Compilando CSS con Tailwind...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: No se pudo compilar el CSS
    pause
    exit /b 1
)

echo.
echo ================================================
echo INSTALACION COMPLETADA EXITOSAMENTE
echo ================================================
echo.
echo Para iniciar el servidor ejecuta: npm start
echo O en modo desarrollo: npm run dev
echo.
echo El sistema estara disponible en: http://localhost:3000
echo.
echo Usuarios de prueba:
echo   Admin:      admin@clinica.com / admin123
echo   Doctor:     doctor@clinica.com / doctor123
echo   Recepcion:  recepcion@clinica.com / recepcion123
echo.
pause

