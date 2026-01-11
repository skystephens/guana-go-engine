#!/bin/bash
# Quick Start - GuanaGo San Andrés Map

echo "🗺️  GuanaGo San Andrés - Quick Start"
echo "===================================="
echo ""

# Check Node
echo "1️⃣  Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no instalado. Descarga: https://nodejs.org"
    exit 1
fi
echo "✅ Node $(node --version)"
echo ""

# Install dependencies
echo "2️⃣  Instalando dependencias..."
npm install --silent
cd guanago-backend
npm install --silent
cd ..
echo "✅ Dependencias instaladas"
echo ""

# Check .env
echo "3️⃣  Verificando .env..."
if [ ! -f .env ]; then
    echo "❌ .env no encontrado"
    echo "   Copia: cp .env.example .env"
    echo "   Luego edita .env con tus credenciales"
    exit 1
fi
echo "✅ .env encontrado"
echo ""

# Summary
echo "4️⃣  LISTO PARA EJECUTAR"
echo "======================================"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd guanago-backend"
echo "  npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Navegador:"
echo "  http://localhost:5173"
echo "  → Navega a MapView para ver el mapa"
echo ""
echo "======================================"
