# 📤 Pasos para Deploy en Render

## OPCIÓN A: Usar GitHub (Recomendado - Más fácil)

### 1️⃣ Crear repositorio en GitHub
- Ve a https://github.com/new
- Nombre: `guana-go-engine`
- Descripción: "App turística San Andrés con panel de afiliados"
- Privado o Público (tu elección)
- NO inicialices con README
- Click "Create repository"

### 2️⃣ Subir código a GitHub
Copia y pega en PowerShell:

```powershell
# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/guana-go-engine.git
git branch -M main
git push -u origin main
```

### 3️⃣ Conectar a Render
1. Ve a https://dashboard.render.com
2. Inicia sesión (o crea cuenta con GitHub)
3. Click "New" → "Web Service"
4. Busca y selecciona `guana-go-engine`
5. Configura:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
6. Click "Deploy"

### 4️⃣ Deploy del Backend (Opcional)
Repite paso 3 pero en "Root Directory" escribe: `guanago-backend`

---

## OPCIÓN B: Sin GitHub (Más lento)

Si no quieres usar GitHub:

1. Ve a https://dashboard.render.com
2. Click "New" → "Static Site" (para frontend)
3. Sube archivos
4. Para backend, usa "Web Service" → "Upload Git"

---

## 🔑 Variables de Entorno Necesarias

**Frontend (.env)**
```
VITE_MAPBOX_API_KEY=pk.eyJ...
VITE_AIRTABLE_API_KEY=pat...
```

**Backend (.env)**
```
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
```

---

## ✅ Verificación Post-Deploy

Después que Render termine (10-15 min):

```bash
# Frontend URL
https://guana-go-frontend.onrender.com

# Backend Health
https://guana-go-backend.onrender.com/health

# API Mapa
https://guana-go-backend.onrender.com/api/v1/locations.geojson
```

---

## 🆘 Troubleshooting

| Error | Solución |
|-------|----------|
| "Module not found" | Ejecuta `npm install` localmente primero |
| "Build timeout" | Aumenta timeout en Render (Plan Pro) |
| "Variables no se cargan" | Verifica que están en Render Dashboard → Environment |
| "API timeout" | Backend puede estar durmido (plan free), espera 30s |

---

## 📞 Soporte Render

- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: https://render.com/support

**¿Necesitas más ayuda? Pregunta en el chat.**
