import { useEffect, useState, FormEventHandler, ReactNode, FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Almacen, AlmacenForm } from '@/types';
import { Textarea } from '@headlessui/react';
import { url } from 'inspector';
import almacen from '@/routes/sucursal/almacen';
import { Checkbox } from './ui/checkbox';



interface AlmacenDialogProps {
    trigger:ReactNode;
    almacenData?: Almacen|null;
    sucursalId:string|number;
    mode?:"create"|"edit";
}


export default function AlmacenDialog({
    trigger,
    almacenData = null,
    sucursalId,
    mode = "create"
}: AlmacenDialogProps) {

    const [open,setOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset,clearErrors } = useForm<AlmacenForm>({
        nombre: almacenData?.nombre || "",
        descripcion: almacenData?.descripcion || "",
        ubicacion:almacenData?.ubicacion || '',
        sucursal_id: sucursalId,
        activo:almacenData?.activo || null
    });

  // sincronizar cuando cambie usuarioData (por ejemplo al abrir en modo edit)
    useEffect(() => {
        if(mode == "edit" && almacenData){
            setData({
                nombre: almacenData.nombre ?? "",
                descripcion: almacenData.descripcion ?? "",
                ubicacion: almacenData.ubicacion ?? "",
                activo: almacenData.activo ?? false,  //
            });
            clearErrors();
        }
        if(mode == "create"){
            setData((d) => ({ ...d,sucursal_id:sucursalId}));
        }

    },[almacenData,sucursalId,mode]);


    const handleSubmit: FormEventHandler = (e:FormEvent) => {
        e.preventDefault();

       if(mode == "edit" && almacenData){
            put(almacen.update(almacenData?.id).url,{
                preserveScroll:true,
                onSuccess: () =>{
                    setOpen(false);
                },
                onError:(e)=>{
                    console.log(e);
                    
                }
            });
       }

       if(mode == "create"){
            post(almacen.store().url,{
                preserveScroll:true,
                onSuccess: ()=>{
                    reset();
                    setOpen(false);
                }
            });
       }
    };

    const handleClose = () => {
        setOpen(false);
        clearErrors();
        // opcional: al cerrar en modo create, limpiar inputs
        if (mode === "create") {
        reset();
        // reestablecer el tipo al default
        setData((d) => ({ ...d}));
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleClose())}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'create' ?  'Agregar almacén': 'Editar almacén'}
                        </DialogTitle>
                        <DialogDescription>
                             {mode === "create"
                                ? "Completa los datos del nuevo almacén"
                                : "Modifica los datos del almacén"}
                        </DialogDescription>
                    </DialogHeader>    
                        <div className="grid gap-4 py-4">

                            {/* Nombre del Almacén */}
                            <div className="grid gap-3">
                                <Label htmlFor="nombre">Nombre del Almacén *</Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej: Almacén Central"
                                    disabled={processing}
                                    className={errors.nombre ? 'border-destructive' : ''}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-destructive">{errors.nombre}</p>
                                )}
                            </div>

                            {/* Ubicación */}
                            <div className="grid gap-3">
                                <Label htmlFor="ubicacion">Ubicación *</Label>
                                <Input
                                    id="ubicacion"
                                    name="ubicacion"
                                    value={data.ubicacion}
                                    onChange={(e) => setData('ubicacion', e.target.value)}
                                    placeholder="Ej: Planta Baja, Área Norte"
                                    disabled={processing}
                                    className={errors.ubicacion ? 'border-destructive' : ''}
                                />
                                {errors.ubicacion && (
                                    <p className="text-sm text-destructive">{errors.ubicacion}</p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div className="grid gap-3">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Descripción del almacén (opcional)"
                                    disabled={processing}
                                    rows={3}
                                    className={errors.descripcion ? 'border-destructive' : ''}
                                />
                                {errors.descripcion && (
                                    <p className="text-sm text-destructive">{errors.descripcion}</p>
                                )}
                            </div>

                            {/* Estado Activo */}
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="activo"
                                    name='activo'
                                    checked={data.activo ?? false}
                                    onCheckedChange={(checked) => setData("activo", checked as boolean)}
                                />
                                <Label htmlFor="activo" className="cursor-pointer">
                                    Almacén activo
                                </Label>
                            </div>
                        </div>

                    <DialogFooter>
                        <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                        {processing
                            ? "Guardando..."
                            : mode === "create"
                            ? "Crear usuario"
                            : "Guardar cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}