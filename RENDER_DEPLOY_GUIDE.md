# 🚀 Guía de Deploy en Render

## Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio llamado `guana-go-engine`
3. NO inicialices con README (usamos el nuestro)

## Paso 2: Subir código a GitHub

```powershell
# En tu terminal en la carpeta del proyecto
git remote add origin https://github.com/TU_USUARIO/guana-go-engine.git
git branch -M main
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu usuario de GitHub.

## Paso 3: Deploy en Render

1. Ve a https://dashboard.render.com
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New" → "Web Service"
4. Selecciona el repositorio `guana-go-engine`
5. Configuración:
   - **Name**: `guana-go-frontend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Branch**: main

6. Agrega variables de entorno (Environment):
   ```
   VITE_MAPBOX_API_KEY=pk.eyJ...
   VITE_AIRTABLE_API_KEY=pat...
   ```

7. Haz clic en "Deploy"

## Paso 4: Deploy del Backend

1. Repite pasos 3-5 pero con:
   - **Name**: `guana-go-backend`
   - **Root Directory**: `guanago-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

2. Variables de entorno:
   ```
   PORT=5000
   AIRTABLE_API_KEY=pat...
   AIRTABLE_BASE_ID=app...
   NODE_ENV=production
   ```

## Comandos útiles

```powershell
# Ver estado del repositorio
git status

# Ver commits
git log --oneline

# Hacer un nuevo commit después de cambios
git add .
git commit -m "Describe los cambios"
git push
```

## URLs después del deploy

- **Frontend**: `https://guana-go-frontend.onrender.com`
- **Backend**: `https://guana-go-backend.onrender.com`
- **API Mapa**: `https://guana-go-backend.onrender.com/api/v1/locations.geojson`

---

**¿Necesitas ayuda?** Las apps van a estar en el dashboard de Render. Puedes monitorear logs en tiempo real.
