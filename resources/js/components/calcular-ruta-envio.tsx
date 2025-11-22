import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Iconos personalizados
const iconoSucursal = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconoCliente = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface CalculadoraRutaEnvioProps {
  origenCoordenadas: [number, number]; // [lat, lon] de la sucursal
  destinoCoordenadas: [number, number]; // [lat, lon] del cliente
  origenNombre?: string;
  destinoNombre?: string;
  onRutaCalculada?: (data: {
    distanciaKm: number;
    duracionMinutos: number;
    costoEnvio: number;
  }) => void;
}

interface RutaOSRM {
  coordinates: [number, number][]; // [lat, lon]
  distance: number; // metros
  duration: number; // segundos
}

// Componente para ajustar el zoom del mapa automáticamente
function AjustarZoom({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
}

export default function CalculadoraRutaEnvio({
  origenCoordenadas,
  destinoCoordenadas,
  origenNombre = 'Sucursal',
  destinoNombre = 'Cliente',
  onRutaCalculada
}: CalculadoraRutaEnvioProps) {
  const [ruta, setRuta] = useState<RutaOSRM | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<number>(0);
  const [duracionMinutos, setDuracionMinutos] = useState<number>(0);
  const [costoEnvio, setCostoEnvio] = useState<number>(0);

  // Calcular costo de envío basado en distancia
  const calcularCostoEnvio = (distanciaKm: number): number => {
    const COSTO_BASE = 30; // $30 pesos base
    const COSTO_POR_KM = 8; // $8 pesos por km
    const DISTANCIA_GRATIS = 2; // Primeros 2km incluidos en base
    
    if (distanciaKm <= DISTANCIA_GRATIS) {
      return COSTO_BASE;
    }
    
    const kmAdicionales = distanciaKm - DISTANCIA_GRATIS;
    return COSTO_BASE + (kmAdicionales * COSTO_POR_KM);
  };

  // Obtener ruta de OSRM
  const obtenerRuta = async () => {
    setCargando(true);
    setError(null);
    
    try {
      // OSRM requiere formato: lon,lat (al revés de lo normal)
      const coordenadasOSRM = `${origenCoordenadas[1]},${origenCoordenadas[0]};${destinoCoordenadas[1]},${destinoCoordenadas[0]}`;
      
      // API de OSRM (servicio público y gratuito)
      const url = `https://router.project-osrm.org/route/v1/driving/${coordenadasOSRM}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al calcular la ruta');
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No se pudo encontrar una ruta');
      }
      
      const route = data.routes[0];
      
      // Convertir coordenadas de GeoJSON (lon, lat) a Leaflet (lat, lon)
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] // Invertir lon,lat a lat,lon
      );
      
      const rutaData: RutaOSRM = {
        coordinates,
        distance: route.distance, // metros
        duration: route.duration  // segundos
      };
      
      setRuta(rutaData);
      
      // Calcular valores
      const distancia = route.distance / 1000; // convertir a km
      const duracion = Math.round(route.duration / 60); // convertir a minutos
      const costo = calcularCostoEnvio(distancia);
      
      setDistanciaKm(distancia);
      setDuracionMinutos(duracion);
      setCostoEnvio(costo);
      
      // Notificar al componente padre
      if (onRutaCalculada) {
        onRutaCalculada({
          distanciaKm: distancia,
          duracionMinutos: duracion,
          costoEnvio: costo
        });
      }
      
    } catch (err) {
      console.error('Error calculando ruta:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al calcular la ruta');
    } finally {
      setCargando(false);
    }
  };

  // Calcular ruta cuando cambian las coordenadas
  useEffect(() => {
    // Crear una clave única para las coordenadas actuales
    const coordenadasKey = `${origenCoordenadas[0]},${origenCoordenadas[1]}-${destinoCoordenadas[0]},${destinoCoordenadas[1]}`;
    
    // Solo calcular si tenemos coordenadas válidas
    if (origenCoordenadas && destinoCoordenadas && 
        origenCoordenadas[0] && origenCoordenadas[1] && 
        destinoCoordenadas[0] && destinoCoordenadas[1]) {
      obtenerRuta();
    }
  }, [
    origenCoordenadas[0], 
    origenCoordenadas[1], 
    destinoCoordenadas[0], 
    destinoCoordenadas[1]
  ]); // Solo cuando cambien las coordenadas específicas

  // Calcular bounds del mapa
  const bounds = origenCoordenadas && destinoCoordenadas 
    ? L.latLngBounds([origenCoordenadas, destinoCoordenadas])
    : undefined;

  return (
    <div className="space-y-4">
      {/* Información de la ruta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Distancia */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Distancia</p>
              {cargando ? (
                <div className="mt-1 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-500">Calculando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {distanciaKm.toFixed(2)} km
                </p>
              )}
            </div>
            <div className="text-3xl">📏</div>
          </div>
        </div>

        {/* Duración */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Tiempo Est.</p>
              {cargando ? (
                <div className="mt-1 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm text-green-500">Calculando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {duracionMinutos} min
                </p>
              )}
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        {/* Costo de Envío */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Costo Envío</p>
              {cargando ? (
                <div className="mt-1 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-purple-500">Calculando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  ${costoEnvio.toFixed(2)}
                </p>
              )}
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
          <button
            onClick={obtenerRuta}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {/* Información adicional */}
      {!cargando && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Detalles del Cálculo:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tarifa base: <strong>$30.00</strong> (incluye primeros 2km)</li>
                <li>• Tarifa por kilómetro adicional: <strong>$8.00/km</strong></li>
                <li>• Ruta calculada sobre calles reales (no línea recta)</li>
                <li>• Tiempo estimado incluye tráfico promedio</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mapa con la ruta */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <MapContainer
          center={origenCoordenadas}
          zoom={13}
          style={{ height: '500px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marker de Sucursal (Origen) */}
          <Marker position={origenCoordenadas} icon={iconoSucursal}>
            <Popup>
              <div className="text-center">
                <strong className="text-red-600">🏪 {origenNombre}</strong>
                <p className="text-xs text-gray-600 mt-1">Punto de origen</p>
              </div>
            </Popup>
          </Marker>

          {/* Marker de Cliente (Destino) */}
          <Marker position={destinoCoordenadas} icon={iconoCliente}>
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">🏠 {destinoNombre}</strong>
                <p className="text-xs text-gray-600 mt-1">Punto de entrega</p>
              </div>
            </Popup>
          </Marker>

          {/* Línea de la ruta calculada */}
          {ruta && ruta.coordinates && ruta.coordinates.length > 0 && (
            <Polyline
              positions={ruta.coordinates}
              color="#3B82F6"
              weight={5}
              opacity={0.7}
            />
          )}

          {/* Ajustar zoom para mostrar toda la ruta */}
          {bounds && <AjustarZoom bounds={bounds} />}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
          <span>Sucursal (Origen)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
          <span>Cliente (Destino)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-500 rounded"></div>
          <span>Ruta calculada</span>
        </div>
      </div>

      {/* Botón para recalcular */}
      {!cargando && !error && (
        <div className="flex justify-center">
          <button
            onClick={obtenerRuta}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            🔄 Recalcular ruta
          </button>
        </div>
      )}
    </div>
  );
}