#!/bin/bash

echo "================================================"
echo "INSTALACIÓN DEL SISTEMA DE CLÍNICA DENTAL"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "[1/6] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js no está instalado${NC}"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}OK - Node.js instalado: $(node --version)${NC}"

# Verificar MySQL
echo ""
echo "[2/6] Verificando MySQL..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}ADVERTENCIA: MySQL no se encuentra en el PATH${NC}"
    echo "Asegúrate de que MySQL esté instalado y corriendo"
else
    echo -e "${GREEN}OK - MySQL encontrado${NC}"
fi

# Instalar dependencias
echo ""
echo "[3/6] Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: No se pudieron instalar las dependencias${NC}"
    exit 1
fi
echo -e "${GREEN}OK - Dependencias instaladas${NC}"

# Generar cliente de Prisma
echo ""
echo "[4/6] Generando cliente de Prisma..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: No se pudo generar el cliente de Prisma${NC}"
    exit 1
fi
echo -e "${GREEN}OK - Cliente de Prisma generado${NC}"

# Crear base de datos y tablas
echo ""
echo "[5/6] Creando base de datos y tablas..."
echo -e "${YELLOW}IMPORTANTE: Asegúrate de tener MySQL corriendo${NC}"
echo -e "${YELLOW}y la base de datos 'clinica_dental' creada${NC}"
echo ""
echo "Presiona Enter para continuar o Ctrl+C para cancelar..."
read

npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: No se pudieron ejecutar las migraciones${NC}"
    echo "Verifica que MySQL esté corriendo y la base de datos exista"
    exit 1
fi
echo -e "${GREEN}OK - Migraciones ejecutadas${NC}"

# Poblar base de datos
echo ""
echo "[6/6] Poblando base de datos con datos de prueba..."
node prisma/seed.js
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}ADVERTENCIA: No se pudieron insertar datos de prueba${NC}"
    echo "El sistema seguirá funcionando pero sin datos iniciales"
fi

# Compilar CSS
echo ""
echo "[7/7] Compilando CSS con Tailwind..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: No se pudo compilar el CSS${NC}"
    exit 1
fi
echo -e "${GREEN}OK - CSS compilado${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}INSTALACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "================================================"
echo ""
echo "Para iniciar el servidor ejecuta: npm start"
echo "O en modo desarrollo: npm run dev"
echo ""
echo "El sistema estará disponible en: http://localhost:3000"
echo ""
echo "Usuarios de prueba:"
echo "  Admin:      admin@clinica.com / admin123"
echo "  Doctor:     doctor@clinica.com / doctor123"
echo "  Recepción:  recepcion@clinica.com / recepcion123"
echo ""

