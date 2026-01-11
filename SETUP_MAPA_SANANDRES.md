# 🗺️ GuanaGo - App Turística San Andrés

## Setup & Ejecución Local

### 1. **Backend (Express)**

```bash
cd guanago-backend
npm install
npm start  # o: node src/server.js
```

El backend corre en `http://localhost:3000` y expone:
- `GET /api/v1/locations.geojson` - POIs desde Airtable (con fallback local)
- `GET /` - Mapa Mapbox estático en HTML
- `GET /api/v1/trace` - Registro de trazabilidad

**Notas:**
- El archivo `.env` (raíz) contiene `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `MAPBOX_API_KEY`
- Si Airtable no es accesible, usa fallback local desde `data/pois-san-andres.json`
- Fallback también disponible en `public/data/pois-san-andres.json` para frontend

### 2. **Frontend (React + Vite)**

```bash
npm install
npm run dev
```

Frontend corre en `http://localhost:5173` (por defecto Vite).

**Nueva página:**
- `pages/MapView.tsx` - Mapa interactivo de San Andrés con:
  - Mapbox GL JS (requiere `VITE_MAPBOX_API_KEY` en `.env`)
  - POIs desde backend `/api/v1/locations.geojson`
  - Fallback local `public/data/pois-san-andres.json`
  - Clickeable POIs con popups con detalles (dirección, teléfono, foto)
  - Leyenda de categorías (Restaurante, Hotel, Playas, Tours, Servicios)

**Acceder a MapView:**
- Ruta: `App.tsx` → `AppRoute.SAN_ANDRES_MAP`
- Enlace en navegación o directamente: usa `navigateTo(AppRoute.SAN_ANDRES_MAP)`

### 3. **Base de Datos - Airtable**

**Tabla:** `Directorio_Mapa` en la base `AIRTABLE_BASE_ID`

**Campos esperados:**
- `Nombre` (text) - Nombre del lugar
- `Categoria` (select) - Restaurante, Hotel, Playas, Tours, Servicios, etc.
- `Plan` (select) - Gratis, Estándar, Premium
- `Direccion` (text) - Dirección física
- `Telefono` (text) - Teléfono
- `Latitud` (number) - Coordenada Y (e.g., 12.5847)
- `Longitud` (number) - Coordenada X (e.g., -81.3871)
- `Foto_Principal` (attachment) - Imagen del lugar
- `ID_Slug` (text) - URL-friendly slug
- `Promo_Activa` (text) - Promoción vigente

**Mapeo GeoJSON:**

```json
{
  "type": "Feature",
  "properties": {
    "storeName": "Nombre",
    "categoria": "Categoria",
    "plan": "Plan",
    "direccion": "Direccion",
    "telefono": "Telefono",
    "foto": "URL de Foto_Principal[0].url",
    "id_slug": "ID_Slug",
    "promo": "Promo_Activa"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [Longitud, Latitud]
  }
}
```

## Archivos Clave Creados/Modificados

| Archivo | Cambios |
|---------|---------|
| `data/pois-san-andres.json` | ✅ Creado - Fallback local con 10 POIs de demo |
| `public/data/pois-san-andres.json` | ✅ Creado - Copia para que frontend lo sirva |
| `guanago-backend/src/routes/mapa.js` | ✅ Actualizado - Lee Airtable con fallback local |
| `pages/MapView.tsx` | ✅ Creado - Mapa interactivo con Mapbox GL + POIs |
| `services/api.ts` | ✅ Actualizado - Añadido `getPOIsFromBackend()` |
| `types.ts` | ✅ Actualizado - Enum `AppRoute.SAN_ANDRES_MAP` |
| `App.tsx` | ✅ Actualizado - Import MapView y ruta en switch |
| `guanago-backend/src/test-api.js` | ✅ Creado - Script de prueba para Airtable |

## Testing

### Backend
```bash
cd guanago-backend
node src/test-api.js  # Prueba conexión Airtable + fallback
node src/server.js    # Inicia servidor
```

### Endpoint
```powershell
# Probar GeoJSON
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/locations.geojson" | Select-Object -ExpandProperty Content
```

Respuesta esperada:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { ... },
      "geometry": { "type": "Point", "coordinates": [...] }
    }
  ]
}
```

### Frontend
```bash
npm run dev
# Abre http://localhost:5173
# Navega a MapView (o crea botón en Home para ir a SAN_ANDRES_MAP)
```

## Próximos Pasos (Roadmap)

1. **✅ Fallback local** - POIs mock para desarrollo offline
2. **✅ Endpoint GeoJSON** - `/api/v1/locations.geojson` con fallback
3. **✅ Página MapView** - Mapa interactivo con Mapbox GL
4. **⏳ Conectar Airtable** - Validar credenciales en `.env` y sincronizar datos vivos
5. **⏳ Direcciones/Routing** - Integrar Mapbox Directions o OpenRouteService para "Cómo llegar"
6. **⏳ Búsqueda/Filtros** - Filtrar POIs por categoría, plan, distancia
7. **⏳ Detalles POI** - Página individual con reseñas, horarios, reserva
8. **⏳ Reservas** - Endpoint `POST /api/v1/reserve` con bloqueo de inventario
9. **⏳ Pagos** - Integrar pasarela (PayU, Stripe) en checkout
10. **⏳ Mover webhooks** - Cambiar llamadas Make.com directo desde frontend a proxy backend

## Variables de Entorno

Asegurate de que `.env` (raíz) tiene:

```env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Directorio_Mapa
MAPBOX_API_KEY=pk.eyJ1IjoiZ3VhbmlhZ28i...

# (Opcional si usas Vite)
VITE_MAPBOX_API_KEY=pk.eyJ1IjoiZ3VhbmlhZ28i...
```

## Troubleshooting

**Error: "No se puede conectar al servidor remoto"**
- Verifica que backend esté corriendo: `http://localhost:3000`
- Revisa logs en terminal del backend

**Error: "Tabla Directorio_Mapa no existe"**
- Verifica `AIRTABLE_TABLE_NAME` en `.env`
- Confirma que la tabla existe en tu base de Airtable

**Error: "Mapbox token inválido"**
- Verifica `MAPBOX_API_KEY` y `VITE_MAPBOX_API_KEY` en `.env`
- Token debe ser público (pk.eyJ...)

**POIs no aparecen en el mapa**
- Abre DevTools (F12) → Console
- Busca mensajes de error en petición a `/api/v1/locations.geojson`
- Verifica que el GeoJSON tenga coordenadas válidas (lng/lat)

## Notas Técnicas

- **Mapbox GL JS v3**: Usado para renderizar mapa base y POIs como círculos
- **Fallback local**: Si Airtable falla, se usa `data/pois-san-andres.json` (10 POIs de demo)
- **CORS**: Backend tiene `cors()` activado en Express
- **Cache**: Respuestas GeoJSON se cachean 5 minutos en el navegador
- **Tipos**: TypeScript con tipos `POI` definidos en `pages/MapView.tsx`

---

**Última actualización:** 10 de enero, 2026
