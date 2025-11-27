import { Map, Marker } from 'pigeon-maps'
import { useState, useEffect } from 'react'

interface SelectorUbicacionSucursalProps {
    onUbicacionSeleccionada: (data: {
        coordenadas: [number, number];
        direccion: string;
    }) => void
    ubicacionInicial?: [number, number] | null
    direccionInicial?: string
}

export default function SelectorUbicacionSucursal({ 
    onUbicacionSeleccionada, 
    ubicacionInicial,
    direccionInicial 
}: SelectorUbicacionSucursalProps) {
    const [ubicacion, setUbicacion] = useState<[number, number] | null>(ubicacionInicial || null)
    const [direccion, setDireccion] = useState<string>(direccionInicial || '')
    const [direccionBusqueda, setDireccionBusqueda] = useState<string>(direccionInicial || '')
    const [buscando, setBuscando] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // Geocodificación: Dirección → Coordenadas
    const buscarDireccion = async (direccion: string) => {
        if (!direccion.trim()) return
        
        setBuscando(true)
        setError(null)
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Guadalajara, Jalisco, Mexico')}&limit=1&addressdetails=1`
            )
            
            if (!response.ok) {
                throw new Error('Error en la búsqueda')
            }
            
            const data = await response.json()
            
            if (data && data.length > 0) {
                const resultado = data[0]
                const nuevasCoordenadas: [number, number] = [
                    Number(parseFloat(resultado.lat)),
                    Number(parseFloat(resultado.lon))
                ]
                
                setUbicacion(nuevasCoordenadas)
                setDireccion(resultado.display_name)
                setDireccionBusqueda(direccion)
                
                // DEVOLVER DATOS AL PADRE
                onUbicacionSeleccionada({
                    coordenadas: nuevasCoordenadas,
                    direccion: resultado.display_name
                })
            } else {
                throw new Error('No se encontró la dirección')
            }
            
        } catch (err) {
            console.error('Error en geocodificación:', err)
            setError('No se pudo encontrar la dirección. Verifica que esté correcta.')
        } finally {
            setBuscando(false)
        }
    }

    // Manejar click en el mapa
    const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
        // Asegurar que las coordenadas sean números
        const coordenadas: [number, number] = [
            Number(latLng[0]),
            Number(latLng[1])
        ]
        setUbicacion(coordenadas)
        reverseGeocoding(coordenadas)
    }

    // Reverse geocoding: Coordenadas → Dirección
    const reverseGeocoding = async (coords: [number, number]) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`
            )
            
            if (response.ok) {
                const data = await response.json()
                const direccionEncontrada = data.display_name || 'Dirección no disponible'
                
                setDireccion(direccionEncontrada)
                setDireccionBusqueda(direccionEncontrada)
                
                // DEVOLVER DATOS AL PADRE
                onUbicacionSeleccionada({
                    coordenadas: coords,
                    direccion: direccionEncontrada
                })
            } else {
                onUbicacionSeleccionada({
                    coordenadas: coords,
                    direccion: 'Dirección no disponible'
                })
            }
        } catch (err) {
            console.error('Error en reverse geocoding:', err)
            onUbicacionSeleccionada({
                coordenadas: coords,
                direccion: 'Error al obtener dirección'
            })
        }
    }

    // Buscar dirección cuando se presiona Enter
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            buscarDireccion(direccionBusqueda)
        }
    }

    // Buscar automáticamente cuando cambia la dirección inicial
    useEffect(() => {
        if (direccionInicial && direccionInicial.trim() && !ubicacionInicial) {
            // Si hay dirección inicial pero no coordenadas, buscar automáticamente
            buscarDireccion(direccionInicial)
        }
    }, [direccionInicial])

    // Sincronizar con ubicación inicial si se proporciona
    useEffect(() => {
        if (ubicacionInicial && !ubicacion) {
            setUbicacion(ubicacionInicial)
            // Hacer reverse geocoding para obtener la dirección
            reverseGeocoding(ubicacionInicial)
        }
    }, [ubicacionInicial])

    // Sincronizar dirección de búsqueda con dirección inicial
    useEffect(() => {
        if (direccionInicial && direccionInicial !== direccionBusqueda) {
            setDireccionBusqueda(direccionInicial)
        }
    }, [direccionInicial])

    return (
        <div className="space-y-4">
            {/* Buscador de direcciones */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    📍 Buscar Dirección de la Sucursal
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={direccionBusqueda}
                        onChange={(e) => setDireccionBusqueda(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe la dirección completa de la sucursal..."
                        className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        disabled={buscando}
                    />
                    <button
                        onClick={() => buscarDireccion(direccionBusqueda)}
                        disabled={buscando || !direccionBusqueda.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {buscando ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Buscando...
                            </>
                        ) : (
                            '🔍 Buscar'
                        )}
                    </button>
                </div>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{error}</p>
                        <p className="text-red-600 text-xs mt-1">
                            Sugerencia: Asegúrate de incluir ciudad y estado (ej: "Guadalajara, Jalisco")
                        </p>
                    </div>
                )}

                {/* Indicador de búsqueda automática */}
                {buscando && direccionInicial && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="text-blue-700 text-sm flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span>Buscando ubicación automáticamente...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Información de la ubicación seleccionada */}
            {ubicacion && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-semibold text-green-800 text-sm mb-1">
                                ✅ Ubicación de Sucursal Confirmada
                            </h4>
                            {direccion && (
                                <p className="text-green-700 text-sm mb-2">
                                    {direccion}
                                </p>
                            )}
                            <p className="text-green-600 text-xs">
                                Coordenadas: {Number(ubicacion[0]).toFixed(6)}, {Number(ubicacion[1]).toFixed(6)}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setUbicacion(null)
                                setDireccion('')
                                setDireccionBusqueda('')
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Limpiar ubicación"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                    💡 <strong>Dos formas de seleccionar:</strong><br/>
                    1. Escribe la dirección y presiona "Buscar"<br/>
                    2. Haz click directamente en la ubicación exacta del mapa
                </p>
                {!ubicacion && (
                    <p className="text-sm text-blue-600 mt-2">
                        📝 <strong>Tip:</strong> La dirección que escribas arriba se buscará automáticamente en el mapa.
                    </p>
                )}
            </div>

            {/* Mapa */}
            <div className="h-80 rounded-lg border border-gray-300 overflow-hidden relative">
                <Map 
                    center={ubicacion || [20.6667, -103.3333]}
                    zoom={ubicacion ? 16 : 12}
                    height={320}
                    onClick={handleMapClick}
                >
                    {ubicacion && (
                        <Marker 
                            anchor={ubicacion} 
                            width={45}
                            color="#EF4444"
                        />
                    )}
                </Map>

                {/* Estado de carga en el mapa - overlay absoluto */}
                {buscando && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-sm font-medium">Buscando ubicación...</span>
                        </div>
                    </div>
                )}

                {/* Tooltip de ubicación - tooltip fijo debajo del mapa */}
                {ubicacion && direccion && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg border shadow-md text-sm font-semibold max-w-xs pointer-events-none">
                        <div className="text-red-600 flex items-center gap-1">
                            <span>🏪</span>
                            <span>Sucursal</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                            {direccion.split(',')[0]}...
                        </div>
                    </div>
                )}
            </div>

            {/* Leyenda del mapa */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Ubicación sucursal</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>🗺️</span>
                    <span>Haz click para cambiar ubicación</span>
                </div>
            </div>

            {/* Indicador de éxito */}
            {ubicacion && (
                <div className="flex items-center justify-center">
                    <div className="bg-green-100 border border-green-300 rounded-full px-4 py-1">
                        <div className="text-green-700 text-sm font-medium flex items-center gap-2">
                            <span>✅</span>
                            <span>Ubicación marcada en el mapa</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}