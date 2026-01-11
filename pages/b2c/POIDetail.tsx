import React, { useState } from 'react';

interface POI {
  id: string;
  properties: {
    storeName: string;
    categoria: string;
    plan: string;
    direccion: string;
    telefono: string;
    foto: string;
    promo: string;
    descripcion?: string;
    horario?: string;
  };
  geometry?: {
    coordinates: [number, number];
  };
}

interface POIDetailProps {
  poi: POI;
  onBack: () => void;
  onNavigate?: (route: string, data?: any) => void;
}

const POIDetail: React.FC<POIDetailProps> = ({ poi, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'fotos' | 'resenas'>('info');
  const [showReserveModal, setShowReserveModal] = useState(false);

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

  const getPlanIcon = (plan: string): string => {
    switch (plan) {
      case 'Premium': return '👑';
      case 'Estándar': return '⭐';
      default: return '✨';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pb-20">
      {/* Header con imagen y botón atrás */}
      <div className="relative">
        {/* Imagen de fondo */}
        <div className="h-64 bg-gray-300 overflow-hidden">
          <img
            src={poi.properties.foto}
            alt={poi.properties.storeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40" />
        </div>

        {/* Botón atrás */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-20"
        >
          ← Atrás
        </button>

        {/* Información sobre imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{poi.properties.storeName}</h1>
          <div className="flex gap-2 flex-wrap">
            <span
              className="px-4 py-2 rounded-full text-white font-semibold text-sm"
              style={{ backgroundColor: getCategoryColor(poi.properties.categoria) }}
            >
              {poi.properties.categoria}
            </span>
            {poi.properties.plan !== 'Gratis' && (
              <span className="px-4 py-2 rounded-full bg-yellow-400 text-gray-800 font-semibold text-sm">
                {getPlanIcon(poi.properties.plan)} {poi.properties.plan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Información rápida */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-xs text-gray-600">Dirección</p>
            <p className="font-semibold text-sm">{poi.properties.direccion}</p>
          </div>
          {poi.properties.telefono && (
            <div className="text-center">
              <p className="text-3xl mb-2">☎️</p>
              <p className="text-xs text-gray-600">Contacto</p>
              <a
                href={`tel:${poi.properties.telefono}`}
                className="font-semibold text-sm text-blue-600 hover:underline"
              >
                {poi.properties.telefono}
              </a>
            </div>
          )}
          {poi.properties.horario && (
            <div className="text-center">
              <p className="text-3xl mb-2">🕐</p>
              <p className="text-xs text-gray-600">Horario</p>
              <p className="font-semibold text-sm">{poi.properties.horario}</p>
            </div>
          )}
        </div>

        {/* Promoción (si existe) */}
        {poi.properties.promo && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-600">🎁 PROMOCIÓN ACTIVA</p>
            <p className="text-lg font-bold text-gray-800">{poi.properties.promo}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ℹ️ Información
            </button>
            <button
              onClick={() => setActiveTab('fotos')}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === 'fotos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📸 Fotos
            </button>
            <button
              onClick={() => setActiveTab('resenas')}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === 'resenas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ⭐ Reseñas
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-4">
                {poi.properties.descripcion ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-800">Descripción</h3>
                    <p className="text-gray-700 leading-relaxed">{poi.properties.descripcion}</p>
                  </>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                    <p>No hay descripción disponible para este establecimiento.</p>
                  </div>
                )}

                {/* Información adicional */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 font-semibold uppercase">Plan</p>
                      <p className="text-lg font-bold text-gray-800">{poi.properties.plan}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 font-semibold uppercase">Categoría</p>
                      <p className="text-lg font-bold text-gray-800">{poi.properties.categoria}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fotos' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-200 rounded-lg overflow-hidden h-64">
                    <img
                      src={poi.properties.foto}
                      alt="Principal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center text-gray-600">
                    <p className="text-center">Más fotos próximamente</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resenas' && (
              <div>
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600 mb-4">
                  <p>No hay reseñas aún. ¡Sé el primero en dejar una!</p>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
                  + Agregar Reseña
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {poi.properties.telefono && (
            <a
              href={`tel:${poi.properties.telefono}`}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition text-center text-lg"
            >
              📞 Llamar ahora
            </a>
          )}

          <button
            onClick={() => setShowReserveModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition text-lg"
          >
            📅 Hacer una Reserva
          </button>

          {poi.geometry && (
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition text-lg">
              🗺️ Cómo Llegar
            </button>
          )}
        </div>
      </div>

      {/* Modal de Reserva (placeholder) */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{poi.properties.storeName}</h2>
            <p className="text-gray-600 mb-6">Esta funcionalidad de reservas será implementada próximamente.</p>
            <button
              onClick={() => setShowReserveModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POIDetail;

