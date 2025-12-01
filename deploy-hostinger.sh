#!/bin/bash

echo "🚀 Iniciando deploy hacia Hostinger..."

# Variables
REMOTE_USER="u175256310"
REMOTE_HOST="185.212.71.187"
REMOTE_PORT="65002"
REMOTE_PATH="/home/u175256310/public_html/dental"

# Crear carpeta remota si no existe
echo "📁 Creando estructura de carpetas..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# Subir archivos principales
echo "📦 Subiendo archivos del proyecto..."

# Subir archivos de configuración
scp -P $REMOTE_PORT package.json $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
scp -P $REMOTE_PORT tailwind.config.js $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
scp -P $REMOTE_PORT .gitignore $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Subir carpetas principales
echo "📁 Subiendo carpeta src/..."
scp -r -P $REMOTE_PORT src $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo "📁 Subiendo carpeta prisma/..."
scp -r -P $REMOTE_PORT prisma $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo "📁 Subiendo carpeta uploads/..."
scp -r -P $REMOTE_PORT uploads $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo ""
echo "✅ Archivos subidos correctamente!"
echo ""
echo "⚠️  PASOS SIGUIENTES EN EL SERVIDOR:"
echo "1. Conectar por SSH: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
echo "2. cd $REMOTE_PATH"
echo "3. Crear archivo .env con credenciales de base de datos"
echo "4. npm install --production"
echo "5. npx prisma generate"
echo "6. npx prisma migrate deploy"
echo "7. node prisma/seed.js"
echo "8. pm2 start src/server.js --name dental"
echo ""
echo "🌐 URL: https://tu-dominio.com"
