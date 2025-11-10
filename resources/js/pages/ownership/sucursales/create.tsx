import HeadingSmall from "@/components/heading-small";
import AppLayoutOwnership from "@/layouts/app-layout-ownership";
import { create, edit, index, store, update } from "@/routes/sucursales";
import { BreadcrumbItem, SucursalItem, Horarios, HorarioDia } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeftCircle, Check, Home, Map, MapPin, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InputError from "@/components/input-error";
import { FormEvent } from "react";

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

    const { data, setData, post, put, processing, errors , reset} = useForm({
        nombre: nombreLimpio || '',
        telefono: sucursal?.telefono || '',
        direccion_completa: sucursal?.direccion_completa || '',
        codigo_postal: sucursal?.codigo_postal || '',
        activo: sucursal?.activo ?? true,
        horarios: horariosIniciales
    });
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (isEdit && sucursal) {
            put(update(sucursal.id).url, {
                preserveScroll: true,
                onSuccess: () => {
                    // Opcional: mostrar notificación de éxito
                }
            });
        } else {
            post(store().url, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
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
                                    required
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
                            disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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