import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface POI {
  id: string;
  type: 'Feature';
  properties: {
    storeName: string;
    categoria: string;
    plan: string;
    direccion: string;
    telefono: string;
    foto: string;
    id_slug: string;
    promo: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [filters, setFilters] = useState<{ category: string }>({ category: 'all' });

  // Set Mapbox token from environment
  if (import.meta.env.VITE_MAPBOX_API_KEY) {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;
  }

  // Fetch POIs from backend with fallback
  const loadPOIs = async () => {
    try {
      setLoading(true);
      // Intentar obtener del backend primero
      const response = await fetch('/api/v1/locations.geojson', { timeout: 5000 });
      if (response.ok) {
        const geojson = await response.json();
        return geojson.features || [];
      }
      throw new Error('Backend no disponible');
    } catch (err) {
      // Fallback: cargar del archivo local
      try {
        console.log('Usando fallback local...');
        const response = await fetch('/data/pois-san-andres.json');
        if (response.ok) {
          const geojson = await response.json();
          return geojson.features || [];
        }
      } catch (fallbackErr) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Error desconocido';
        setError(`No se pudieron cargar los POIs (fallback falló): ${msg}`);
        return [];
      }
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudieron cargar los POIs: ${msg}`);
      return [];
    }
  };

  // Get category color
  const getCategoryColor = (categoria: string): string => {
    const colorMap: Record<string, string> = {
      'Restaurante': '#E91E63',
      'Alojamiento': '#FF9800',
      'Hotel': '#FFC107',
      'Tienda': '#4CAF50',
      'Spa': '#00BCD4',
      'Cafeteria': '#795548',
      'Heladeria': '#F06292',
      'Gasolinera': '#607D8B',
      'Hospital': '#F44336',
      'Aeropuerto': '#3F51B5',
      'Iglesia': '#9C27B0',
      'Tour': '#009688',
      'Playa': '#2196F3',
    };
    return colorMap[categoria] || '#757575';
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [-81.385, 12.585], // San Andrés
          zoom: 13,
          pitch: 0,
          bearing: 0,
        });

        // Load POIs and add to map
        const pois = await loadPOIs();

        map.current.on('load', () => {
          // Add GeoJSON source
          map.current!.addSource('pois', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: pois,
            },
          });

          // Add layer for points
          map.current!.addLayer({
            id: 'pois-layer',
            type: 'circle',
            source: 'pois',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'plan'],
                'Gratis', 6,
                'Estándar', 8,
                'Premium', 12,
              ],
              'circle-color': [
                'match',
                ['get', 'categoria'],
                'Restaurante', '#E91E63',
                'Alojamiento', '#FF9800',
                'Hotel', '#FFC107',
                'Tienda', '#4CAF50',
                'Spa', '#00BCD4',
                'Cafeteria', '#795548',
                'Heladeria', '#F06292',
                'Gasolinera', '#607D8B',
                'Hospital', '#F44336',
                'Aeropuerto', '#3F51B5',
                'Iglesia', '#9C27B0',
                'Tour', '#009688',
                'Playa', '#2196F3',
                '#757575',
              ],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });

          // Add labels
          map.current!.addLayer({
            id: 'pois-labels',
            type: 'symbol',
            source: 'pois',
            layout: {
              'text-field': ['get', 'storeName'],
              'text-font': ['Open Sans Semibold'],
              'text-size': 10,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': '#000',
              'text-halo-color': '#fff',
              'text-halo-width': 1,
            },
          });

          // Click handler
          map.current!.on('click', 'pois-layer', (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0] as any;
              setSelectedPOI({
                id: feature.id as string,
                type: 'Feature',
                properties: feature.properties,
                geometry: feature.geometry,
              });
            }
          });

          // Cursor change
          map.current!.on('mouseenter', 'pois-layer', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current!.on('mouseleave', 'pois-layer', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });

          setLoading(false);
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error inicializando mapa: ${msg}`);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Mapa de San Andrés</h1>
        <p className="text-sm text-gray-600">Descubre restaurantes, hoteles, playas y más</p>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Cargando mapa...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-20 left-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-20 max-w-xs">
          <p className="font-semibold">⚠️ Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />

        {/* POI Details Popup */}
        {selectedPOI && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl w-80 z-20 p-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-800 flex-1">{selectedPOI.properties.storeName}</h3>
              <button
                onClick={() => setSelectedPOI(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {selectedPOI.properties.foto && (
              <img
                src={selectedPOI.properties.foto}
                alt={selectedPOI.properties.storeName}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            {/* Category Badge */}
            <div className="mb-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: getCategoryColor(selectedPOI.properties.categoria) }}
              >
                {selectedPOI.properties.categoria}
              </span>
              {selectedPOI.properties.plan !== 'Gratis' && (
                <span className="ml-2 inline-block px-3 py-1 rounded-full bg-yellow-400 text-gray-800 text-xs font-semibold">
                  {selectedPOI.properties.plan}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">📍 Dirección:</span> {selectedPOI.properties.direccion}
              </p>
              {selectedPOI.properties.telefono && (
                <p>
                  <span className="font-semibold">☎️ Teléfono:</span> {selectedPOI.properties.telefono}
                </p>
              )}
              {selectedPOI.properties.promo && (
                <p>
                  <span className="font-semibold">🎁 Promoción:</span> {selectedPOI.properties.promo}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition">
                Ir →
              </button>
              <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 rounded-lg transition">
                ☎️ Llamar
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-20 max-w-xs">
          <p className="font-bold text-gray-800 mb-2">Categorías</p>
          <div className="space-y-1 text-xs">
            {[
              { cat: 'Restaurante', color: '#E91E63' },
              { cat: 'Hotel', color: '#FFC107' },
              { cat: 'Playas', color: '#2196F3' },
              { cat: 'Tours', color: '#009688' },
              { cat: 'Servicios', color: '#9C27B0' },
            ].map(({ cat, color }) => (
              <div key={cat} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-700">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
