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

interface MapaRutaProps {
  origenCoordenadas: [number, number]; // [lat, lon] de la sucursal
  destinoCoordenadas: [number, number]; // [lat, lon] del cliente
  origenNombre?: string;
  destinoNombre?: string;
  distanciaKm?: number; // Distancia ya calculada
  duracionMinutos?: number; // Duración ya calculada
  alturaMapa?: string; // Altura personalizable del mapa
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

export default function MapaRuta({
  origenCoordenadas,
  destinoCoordenadas,
  origenNombre = 'Sucursal',
  destinoNombre = 'Cliente',
  distanciaKm,
  duracionMinutos,
  alturaMapa = '400px'
}: MapaRutaProps) {
  const [ruta, setRuta] = useState<RutaOSRM | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener ruta de OSRM (solo para mostrar en el mapa)
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
      
    } catch (err) {
      console.error('Error calculando ruta:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al calcular la ruta');
      
      // En caso de error, al menos mostrar los marcadores
      setRuta({
        coordinates: [origenCoordenadas, destinoCoordenadas],
        distance: 0,
        duration: 0
      });
    } finally {
      setCargando(false);
    }
  };

  // Calcular ruta cuando cambian las coordenadas
  useEffect(() => {
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
  ]);

  // Calcular bounds del mapa
  const bounds = origenCoordenadas && destinoCoordenadas 
    ? L.latLngBounds([origenCoordenadas, destinoCoordenadas])
    : undefined;

  return (
    <div className="space-y-4">
      {/* Información de la ruta - Solo si se proporcionan datos */}
      {(distanciaKm !== undefined || duracionMinutos !== undefined) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distancia */}
          {distanciaKm !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Distancia</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {distanciaKm.toFixed(2)} km
                  </p>
                </div>
                <div className="text-3xl">📏</div>
              </div>
            </div>
          )}

          {/* Duración */}
          {duracionMinutos !== undefined && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Tiempo Est.</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {duracionMinutos} min
                  </p>
                </div>
                <div className="text-3xl">⏱️</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje de carga */}
      {cargando && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Calculando ruta óptima...</span>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && !cargando && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 text-sm font-medium flex items-center gap-2">
            ⚠️ Mostrando ruta aproximada (línea recta)
          </p>
          <p className="text-yellow-600 text-xs mt-1">
            No se pudo calcular la ruta por calles: {error}
          </p>
        </div>
      )}

      {/* Mapa con la ruta */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <MapContainer
          center={origenCoordenadas}
          zoom={13}
          style={{ height: alturaMapa, width: '100%' }}
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
                {distanciaKm && (
                  <p className="text-xs text-green-600 mt-1">
                    Distancia: {distanciaKm.toFixed(2)} km
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Marker de Cliente (Destino) */}
          <Marker position={destinoCoordenadas} icon={iconoCliente}>
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">🏠 {destinoNombre}</strong>
                <p className="text-xs text-gray-600 mt-1">Punto de entrega</p>
                {duracionMinutos && (
                  <p className="text-xs text-green-600 mt-1">
                    Tiempo estimado: {duracionMinutos} min
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Línea de la ruta calculada */}
          {ruta && ruta.coordinates && ruta.coordinates.length > 0 && (
            <Polyline
              positions={ruta.coordinates}
              color={error ? "#F59E0B" : "#3B82F6"} // Azul si es correcta, amarillo si hay error
              weight={5}
              opacity={0.7}
            />
          )}

          {/* Ajustar zoom para mostrar toda la ruta */}
          {bounds && <AjustarZoom bounds={bounds} />}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
          <span>Sucursal (Origen)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
          <span>Cliente (Destino)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-1 rounded ${error ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
          <span>{error ? 'Ruta aproximada' : 'Ruta calculada'}</span>
        </div>
      </div>
    </div>
  );
}