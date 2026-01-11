#!/bin/bash

# Script para preparar deploy en Render
# Uso: ./prepare-render.sh

echo "🚀 Preparando proyecto para Render..."

# 1. Verificar que Git está configurado
echo "✓ Verificando Git..."
git --version

# 2. Crear archivo .env.production
echo "✓ Creando .env.production..."
cp .env.example .env.production

echo ""
echo "⚠️  IMPORTANTE: Edita .env.production con tus variables reales:"
echo ""
echo "  VITE_MAPBOX_API_KEY=tu_api_key_aqui"
echo "  VITE_AIRTABLE_API_KEY=tu_airtable_key_aqui"
echo ""

# 3. Verificar estructura del proyecto
echo "✓ Verificando estructura..."
if [ -d "guanago-backend" ]; then
  echo "  ✓ Backend encontrado"
fi
if [ -f "vite.config.ts" ]; then
  echo "  ✓ Frontend configurado"
fi
if [ -f "render.yaml" ]; then
  echo "  ✓ render.yaml listo"
fi

# 4. Hacer commit final
echo ""
echo "✓ Estado del repositorio:"
git status

echo ""
echo "📝 Próximos pasos:"
echo "1. Sube el repositorio a GitHub"
echo "2. Ve a https://dashboard.render.com"
echo "3. Conecta tu repositorio GitHub"
echo "4. Deploy automático!"
echo ""
echo "Para más detalles, lee RENDER_DEPLOY_GUIDE.md"
