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
    descripcion?: string;
    horario?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface MapViewProps {
  onSelectPOI?: (poi: POI) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectPOI }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pois, setPOIs] = useState<POI[]>([]);

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
        console.log(`✅ Cargados ${geojson.features?.length || 0} POIs desde backend`);
        return geojson.features || [];
      }
      throw new Error('Backend no disponible');
    } catch (err) {
      // Fallback: cargar del archivo local
      try {
        console.log('📂 Usando fallback local...');
        const response = await fetch('/data/pois-san-andres.json');
        if (response.ok) {
          const geojson = await response.json();
          console.log(`✅ Cargados ${geojson.features?.length || 0} POIs locales`);
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

  // Get unique categories from POIs
  const getCategories = (poiList: POI[]): string[] => {
    const cats = new Set(poiList.map(p => p.properties.categoria));
    return Array.from(cats).sort();
  };

  // Filter POIs by category
  const filteredPOIs = categoryFilter === 'all' 
    ? pois 
    : pois.filter(p => p.properties.categoria === categoryFilter);

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

        // Load POIs
        const loadedPOIs = await loadPOIs();
        setPOIs(loadedPOIs);

        map.current.on('load', () => {
          // Add GeoJSON source
          map.current!.addSource('pois', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: loadedPOIs,
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
              const poi: POI = {
                id: feature.id as string,
                type: 'Feature',
                properties: feature.properties,
                geometry: feature.geometry,
              };
              setSelectedPOI(poi);
              if (onSelectPOI) onSelectPOI(poi);
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
  }, [onSelectPOI]);

  const categories = getCategories(pois);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗺️ Mapa de San Andrés</h1>
          <p className="text-sm text-gray-600">{pois.length} establecimientos disponibles</p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {sidebarOpen ? '📋 Ocultar' : '📋 Mostrar'}
        </button>
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

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Sidebar - Categorías (Colapsable) */}
        <div
          className={`fixed lg:relative top-0 left-0 h-full bg-white shadow-lg lg:shadow-md p-4 z-20 lg:z-10 transition-all duration-300 w-56 ${
            sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">📂 Categorías</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 text-2xl p-1"
              title="Cerrar menú"
            >
              ✕
            </button>
          </div>

          {/* Filter by category */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🎯 Todos ({pois.length})</span>
            </button>

            {categories.map((cat) => {
              const count = pois.filter(p => p.properties.categoria === cat).length;
              const color = getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>
                    {cat} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtered list */}
          {categoryFilter !== 'all' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">En esta categoría:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPOIs.map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => {
                      setSelectedPOI(poi);
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left px-2 py-2 rounded bg-blue-50 hover:bg-blue-100 transition text-sm text-gray-800 border border-blue-200"
                  >
                    <p className="font-semibold truncate">{poi.properties.storeName}</p>
                    <p className="text-xs text-gray-600">{poi.properties.direccion}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button - Always Visible (Desktop & Mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: sidebarOpen ? 'auto' : '1rem',
            right: sidebarOpen ? '1rem' : 'auto',
            zIndex: 9999,
            backgroundColor: '#1e3a8a',
            color: 'white',
            padding: '1rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')}
          title={sidebarOpen ? "Minimizar menú" : "Abrir menú"}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />

          {/* POI Details Popup */}
          {selectedPOI && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-xl w-96 z-20 p-5 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">{selectedPOI.properties.storeName}</h3>
                  <div className="flex gap-2 mt-2">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold"
                      style={{ backgroundColor: getCategoryColor(selectedPOI.properties.categoria) }}
                    >
                      {selectedPOI.properties.categoria}
                    </span>
                    {selectedPOI.properties.plan !== 'Gratis' && (
                      <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-gray-800 text-xs font-semibold">
                        {selectedPOI.properties.plan}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPOI(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {selectedPOI.properties.foto && (
                <img
                  src={selectedPOI.properties.foto}
                  alt={selectedPOI.properties.storeName}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}

              {/* Details */}
              <div className="space-y-3 text-sm text-gray-700 mb-4">
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
              <div className="flex gap-2">
                <button 
                  onClick={() => onSelectPOI?.(selectedPOI)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition"
                >
                  Ver Detalles →
                </button>
                {selectedPOI.properties.telefono && (
                  <a
                    href={`tel:${selectedPOI.properties.telefono}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition text-center"
                  >
                    📞 Llamar
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Legend (smaller, collapsible) */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-20 max-w-xs hidden sm:block">
            <p className="font-bold text-gray-800 text-sm mb-2">Planes</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-gray-700">Gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-gray-700">Estándar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-600" />
                <span className="text-gray-700">Premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
