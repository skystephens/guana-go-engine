const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

console.log('[MAPA] Ruta cargada. ENV:', {
  BASE: process.env.AIRTABLE_BASE_ID ? '✅' : '❌',
  KEY: process.env.AIRTABLE_API_KEY ? '✅' : '❌'
});

// Función para cargar fallback local
const loadLocalFallback = () => {
    try {
        const fallbackPath = path.join(process.cwd(), '..', 'data', 'pois-san-andres.json');
        const altPath = path.join(__dirname, '../../data/pois-san-andres.json');
        
        let data;
        if (fs.existsSync(fallbackPath)) {
            data = fs.readFileSync(fallbackPath, 'utf8');
        } else if (fs.existsSync(altPath)) {
            data = fs.readFileSync(altPath, 'utf8');
        } else {
            throw new Error('Fallback local no encontrado');
        }
        
        const parsed = JSON.parse(data);
        console.log(`[MAPA] Fallback local: ${parsed.features?.length || 0} POIs`);
        return parsed;
    } catch (error) {
        console.error("[MAPA] Error cargando fallback:", error.message);
        return { type: "FeatureCollection", features: [] };
    }
};

// Función auxiliar para convertir coordenadas
const cleanCoordinate = (valor) => {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(',', '.'));
};

// Ruta: GET /api/v1/locations.geojson
router.get('/locations.geojson', async (req, res) => {
    try {
        console.log('[MAPA] GET /locations.geojson');
        
        if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) {
            console.warn('[MAPA] Credenciales Airtable faltantes, usando fallback');
            const fallback = loadLocalFallback();
            res.set('Cache-Control', 'public, max-age=300');
            res.set('Content-Type', 'application/json');
            return res.json(fallback);
        }

        // Llamada a Airtable API
        const apiUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Directorio_Mapa`;
        console.log(`[MAPA] Conectando a: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable HTTP ${response.status}: ${await response.text()}`);
        }

        const airtableData = await response.json();
        console.log(`[MAPA] Airtable respondió: ${airtableData.records?.length || 0} registros`);

        // Mapear registros de Airtable a GeoJSON
        const features = (airtableData.records || [])
            .map((record, idx) => {
                const fields = record.fields || {};
                const lat = cleanCoordinate(fields["Latitud"]);
                const lng = cleanCoordinate(fields["Longitud"]);

                // Validar coordenadas
                if (!lat || !lng || lat === 0 && lng === 0) {
                    console.warn(`[MAPA] Registro ${idx} sin coordenadas válidas: ${fields["Nombre"]}`);
                    return null;
                }

                return {
                    "type": "Feature",
                    "id": record.id,
                    "properties": {
                        "storeName": fields["Nombre"] || "Sin nombre",
                        "categoria": fields["Categoria"] || "Otro",
                        "plan": fields["Plan"] || "Gratis",
                        "direccion": fields["Direccion"] || "San Andrés",
                        "telefono": fields["Telefono"] || "",
                        "foto": fields["Foto_Principal"]?.[0]?.url || "https://via.placeholder.com/150",
                        "id_slug": fields["ID_Slug"] || "",
                        "promo": fields["Promo_Activa"] || "",
                        "descripcion": fields["Descripcion"] || "",
                        "horario": fields["Horario"] || ""
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]  // [longitude, latitude]
                    }
                };
            })
            .filter(f => f !== null);

        const geojson = {
            "type": "FeatureCollection",
            "features": features
        };

        console.log(`[MAPA] Enviando ${features.length} features al cliente`);
        
        res.set('Cache-Control', 'public, max-age=3600');
        res.set('Content-Type', 'application/json');
        res.json(geojson);

    } catch (error) {
        console.error("[MAPA] Error conectando a Airtable:", error.message);
        console.log("[MAPA] Usando fallback local...");
        
        // Fallback automático
        const fallbackData = loadLocalFallback();
        res.set('Cache-Control', 'public, max-age=300');
        res.set('Content-Type', 'application/json');
        res.status(200).json(fallbackData);
    }
});

module.exports = router;