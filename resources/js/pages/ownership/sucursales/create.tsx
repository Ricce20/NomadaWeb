import HeadingSmall from "@/components/heading-small";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import { create, edit, index, store, update } from "@/routes/sucursales";
import { BreadcrumbItem, SucursalItem, Horarios, HorarioDia } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeftCircle, Check, Home, Map, MapPin, Phone, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InputError from "@/components/input-error";
import { FormEvent, useState, useEffect } from "react";
import SelectorUbicacionSucursal from "@/components/selectorUbicacionSucursal";

const diasSemana = [
    { id: 'lunes', nombre: 'Lunes' },
    { id: 'martes', nombre: 'Martes' },
    { id: 'miercoles', nombre: 'Miércoles' },
    { id: 'jueves', nombre: 'Jueves' },
    { id: 'viernes', nombre: 'Viernes' },
    { id: 'sabado', nombre: 'Sábado' },
    { id: 'domingo', nombre: 'Domingo' },
];

interface SucursalFormProps {
    isEdit: boolean;
    sucursal?: SucursalItem | null;
}

export default function SucursalForm({ isEdit, sucursal }: SucursalFormProps) {
    console.log(sucursal);
    
    // Breadcrumbs dinámicos
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: isEdit ? 'Editar Sucursal' : 'Registrar Sucursal',
            href: isEdit && sucursal ? edit(sucursal.id).url : create().url,
        }
    ];

    // Preparar horarios iniciales con tipos correctos
    const horariosIniciales: Horarios = sucursal?.horarios || diasSemana.reduce((acc, dia) => ({
        ...acc,
        [dia.id]: {
            cerrado: false,
            hora_apertura: '08:00',
            hora_cierre: '20:00'
        } as HorarioDia
    }), {} as Horarios);

    // Limpiar el nombre si es edición (remover el prefijo del negocio)
    const nombreLimpio = isEdit && sucursal?.nombre
        ? sucursal.nombre.split(' - ').slice(1).join(' - ')
        : '';

    // Estados para las coordenadas
    const [coordenadasSucursal, setCoordenadasSucursal] = useState<{
        latitud: number | null;
        longitud: number | null;
        direccion: string;
    }>({
        latitud: sucursal?.latitud || null,
        longitud: sucursal?.longitud || null,
        direccion: sucursal?.direccion_completa || ''
    });

    // Estado para preview de imagen
    const [preview, setPreview] = useState<string | null>(sucursal?.image_url || null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: nombreLimpio || '',
        telefono: sucursal?.telefono || '',
        direccion_completa: sucursal?.direccion_completa || '',
        codigo_postal: sucursal?.codigo_postal || '',
        latitud: sucursal?.latitud || null,
        longitud: sucursal?.longitud || null,
        activo: sucursal?.activo ?? true,
        horarios: horariosIniciales,
        image_url: null as File | null,
        ...(isEdit && { _method: 'PUT' })
    });

    // Actualizar datos del formulario cuando cambian las coordenadas
    useEffect(() => {
        setData('latitud', coordenadasSucursal.latitud);
        setData('longitud', coordenadasSucursal.longitud);
        
        // Si hay una nueva dirección del mapa, actualizarla
        if (coordenadasSucursal.direccion && coordenadasSucursal.direccion !== data.direccion_completa) {
            setData('direccion_completa', coordenadasSucursal.direccion);
        }
    }, [coordenadasSucursal]);

    // Actualizar coordenadas cuando cambia la dirección manualmente
    useEffect(() => {
        // Si hay una dirección pero no coordenadas, buscar automáticamente
        if (data.direccion_completa && data.direccion_completa.trim() && 
            !coordenadasSucursal.latitud && !coordenadasSucursal.longitud) {
            
            // Actualizar el estado para que el componente hijo haga la búsqueda
            setCoordenadasSucursal(prev => ({
                ...prev,
                direccion: data.direccion_completa
            }));
        }
    }, [data.direccion_completa]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Validar que se hayan proporcionado coordenadas
        if (!data.latitud || !data.longitud) {
            alert('Por favor, selecciona la ubicación de la sucursal en el mapa');
            return;
        }

        if (isEdit && sucursal) {
            // Cuando hay archivos, usar post con _method
            post(update(sucursal.id).url, {
                method:'put',
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Opcional: mostrar notificación de éxito
                },
                onError: (errors) => {
                    console.log('Errores:', errors);
                }
            });
        } else {
            post(store().url, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setCoordenadasSucursal({
                        latitud: null,
                        longitud: null,
                        direccion: ''
                    });
                    setPreview(null);
                },
                onError: (errors) => {
                    console.log('Errores:', errors);
                }
            });
        }
    };

    const handleHorarioChange = (dia: keyof Horarios, field: keyof HorarioDia, value: string | boolean) => {
        setData('horarios', {
            ...data.horarios,
            [dia]: {
                ...data.horarios[dia],
                [field]: value
            }
        });
    };

    // Manejar datos de ubicación del componente de mapa
    const handleUbicacionSucursal = (data: {
        coordenadas: [number, number];
        direccion: string;
    }) => {
        setCoordenadasSucursal({
            latitud: data.coordenadas[0],
            longitud: data.coordenadas[1],
            direccion: data.direccion
        });
    };

    // Manejar selección de imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image_url', file);
            
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AppLayoutOwnership breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? "Editar Sucursal" : "Registrar Sucursal"} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Heading */}
                <div className="flex items-center gap-4">
                    <HeadingSmall
                        title={isEdit ? "Editar Sucursal" : "Registrar Nueva Sucursal"}
                        description={
                            isEdit
                                ? "Actualiza la información de la sucursal"
                                : "Completa el formulario para agregar una nueva sucursal a tu negocio"
                        }
                    />
                    <Link
                        href={index().url}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-background hover:bg-amber-500 transition-colors"
                    >
                        <ArrowLeftCircle className="w-5 h-5" />
                        Volver
                    </Link>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sección: Datos Generales */}
                    <div className="border-l-4 border-foreground rounded-lg p-6 bg-card shadow-xl dark:shadow-gray-500 dark:shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground mb-6">Datos Generales</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre Input */}
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="flex items-center gap-2 text-foreground">
                                    <Home />
                                    Nombre de la Sucursal
                                </Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Centro, Zapopan Sur, etc."
                                    className="w-full border"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se agregará automáticamente el nombre de tu negocio
                                </p>
                                <InputError message={errors.nombre} />
                            </div>

                            {/* Teléfono Input */}
                            <div className="space-y-2">
                                <Label htmlFor="telefono" className="flex items-center gap-2 text-foreground">
                                    <Phone />
                                    Teléfono de Contacto
                                </Label>
                                <Input
                                    id="telefono"
                                    name="telefono"
                                    type="tel"
                                    maxLength={12}
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    placeholder="33-1234-5678"
                                    className="w-full border"
                                    required
                                />
                                <InputError message={errors.telefono} />
                            </div>

                            {/* Dirección Input */}
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="flex items-center gap-2 text-foreground">
                                    <Map />
                                    Dirección Completa
                                </Label>
                                <Input
                                    id="direccion"
                                    name="direccion_completa"
                                    type="text"
                                    value={data.direccion_completa}
                                    onChange={(e) => setData('direccion_completa', e.target.value)}
                                    placeholder="Calle Falsa 123, Col. Centro, Guadalajara, Jalisco"
                                    className="w-full border"
                                    readOnly
                                />
                                <InputError message={errors.direccion_completa} />
                            </div>

                            {/* C.P Input */}
                            <div className="space-y-2">
                                <Label htmlFor="codigo_postal" className="flex items-center gap-2 text-foreground">
                                    <MapPin />
                                    Código Postal
                                </Label>
                                <Input
                                    id="codigo_postal"
                                    name="codigo_postal"
                                    type="text"
                                    maxLength={5}
                                    value={data.codigo_postal}
                                    onChange={(e) => setData('codigo_postal', e.target.value)}
                                    placeholder="44100"
                                    className="w-full border"
                                    required
                                />
                                <InputError message={errors.codigo_postal} />
                            </div>
                        </div>

                        {/* Input de Imagen */}
                        <div className="mt-6 space-y-3">
                            <Label htmlFor="image_url" className="flex items-center gap-2 text-foreground">
                                <ImageIcon className="w-5 h-5" />
                                Imagen de la Sucursal
                            </Label>
                            
                            {/* Preview de imagen actual o nueva */}
                            {preview && (
                                <div className="mb-3">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {data.image_url ? 'Nueva imagen seleccionada:' : 'Imagen actual:'}
                                    </p>
                                    <div className="relative inline-block">
                                        <img 
                                            src={preview} 
                                            alt="Preview de la sucursal" 
                                            className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                                        />
                                        {data.image_url && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('image_url', null);
                                                    setPreview(sucursal?.image_url || null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                                                title="Cancelar nueva imagen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <Input
                                id="image_url"
                                name="image_url"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full"
                            />
                            
                            <p className="text-xs text-muted-foreground">
                                Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 2MB
                            </p>
                            
                            <InputError message={errors.image_url} />
                        </div>

                        {/* Información de coordenadas */}
                        {(data.latitud && data.longitud) && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">
                                            ✅ Ubicación de sucursal confirmada
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Lat: {data.latitud}, Lng: {data.longitud}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-green-600">
                                            La ubicación se usará para calcular rutas de entrega
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Sección: Ubicación en Mapa */}
                    <div className="border-l-4 border-blue-500 rounded-lg p-6 bg-card shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            Ubicación en Mapa
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700">
                                    💡 <strong>Importante:</strong> Selecciona la ubicación exacta de tu sucursal en el mapa. 
                                    Esto permitirá calcular rutas de entrega precisas para tus pedidos.
                                </p>
                            </div>

                            {/* Componente de mapa con manejo de errores */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <SelectorUbicacionSucursal 
                                    onUbicacionSeleccionada={handleUbicacionSucursal}
                                    ubicacionInicial={
                                        (data.latitud && data.longitud)
                                            ? [Number(data.latitud), Number(data.longitud)] as [number, number]
                                            : null
                                    }
                                    direccionInicial={data.direccion_completa || ''}
                                />
                            </div>

                            {/* Advertencia si no hay ubicación seleccionada */}
                            {!data.latitud && !data.longitud && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-yellow-700 text-sm">
                                        ⚠️ <strong>Ubicación requerida:</strong> Debes seleccionar la ubicación de la sucursal en el mapa para poder guardar.
                                    </p>
                                </div>
                            )}

                            {/* Mostrar ubicación seleccionada si existe */}
                            {data.latitud && data.longitud && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-green-700 text-sm flex items-center gap-2">
                                        <span>✓</span>
                                        <strong>Ubicación guardada:</strong> Lat: {Number(data.latitud).toFixed(6)}, Lon: {Number(data.longitud).toFixed(6)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Errores de validación */}
                        <InputError message={errors.latitud} />
                        <InputError message={errors.longitud} />
                    </div>

                    {/* Sección: Operación y Horarios */}
                    <div className="border-l-4 border-foreground rounded-lg p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground mb-6">Operación y Horarios</h2>

                        {/* Estado de Operación */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-amber-200">
                            <div className="flex items-center gap-3">
                                <Check />
                                <span className="font-medium text-primary">Estado de Operación:</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={data.activo}
                                        onChange={(e) => setData('activo', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                                <span className={`font-semibold ${data.activo ? 'text-green-600' : 'text-destructive'}`}>
                                    {data.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        {/* Horarios */}
                        <div className="space-y-4">
                            <p className="text-sm text-foreground mb-4">
                                Define la hora de apertura y cierre por cada día. (Formato 24h)
                            </p>

                            {diasSemana.map((dia) => (
                                <div key={dia.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-card rounded-lg border-s border-foreground">
                                    <div className="w-32 font-medium text-foreground">
                                        {dia.nombre}
                                    </div>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={data.horarios[dia.id as keyof Horarios]?.cerrado || false}
                                            onChange={(e) => handleHorarioChange(dia.id as keyof Horarios, 'cerrado', e.target.checked)}
                                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-primary">Cerrado todo el día</span>
                                    </label>

                                    {!data.horarios[dia.id as keyof Horarios]?.cerrado && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Input
                                                type="time"
                                                value={data.horarios[dia.id as keyof Horarios]?.hora_apertura || '08:00'}
                                                onChange={(e) => handleHorarioChange(dia.id as keyof Horarios, 'hora_apertura', e.target.value)}
                                                className="w-32"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <Input
                                                type="time"
                                                value={data.horarios[dia.id as keyof Horarios]?.hora_cierre || '20:00'}
                                                onChange={(e) => handleHorarioChange(dia.id as keyof Horarios, 'hora_cierre', e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        <Link
                            href={index().url}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-foreground hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || !data.latitud || !data.longitud}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing
                                ? (isEdit ? 'Actualizando...' : 'Guardando...')
                                : (isEdit ? 'Actualizar Sucursal' : 'Crear Sucursal')
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayoutOwnership>
    );
}