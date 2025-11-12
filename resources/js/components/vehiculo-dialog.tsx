import vehiculo from "@/routes/sucursal/vehiculo";
import { Vehiculo, VehiculoForm } from "@/types";
import { useForm } from "@inertiajs/react";
import { Dialog } from "@radix-ui/react-dialog";
import { FormEvent, FormEventHandler, ReactNode, useEffect, useState } from "react";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";


interface VehiculoProps{
    trigger:ReactNode,
    vehiculoData?:Vehiculo | null,
    sucursalId:string|number,
    mode?:"create" | "edit"
};


export function VehiculoDialog({trigger,vehiculoData,sucursalId,mode}:VehiculoProps) {
    
    const[open,setOpen] = useState(false);

    const {data, setData, put, post, processing, errors, reset, clearErrors} = useForm<VehiculoForm>({
        placa: vehiculoData?.placa ?? "",
        marca: vehiculoData?.marca ?? "",
        modelo: vehiculoData?.modelo ?? "",
        color: vehiculoData?.color ?? "",
        tipo: (vehiculoData?.tipo ??
            "camioneta") as VehiculoForm["tipo"], // default
        kilometros_por_litro: vehiculoData?.kilometros_por_litro ?? undefined,
        precio_litro_combustible:
            vehiculoData?.precio_litro_combustible ?? undefined,
        capacidad_carga_kg: vehiculoData?.capacidad_carga_kg ?? undefined,
        estado: (vehiculoData?.estado ?? "activo") as VehiculoForm["estado"],
    });

    // Si se abre el dialog en modo edición, aseguramos sincronizar los datos
    useEffect(() => {
        if (open && vehiculoData) {
            setData({
                placa: vehiculoData.placa ?? "",
                marca: vehiculoData.marca ?? "",
                modelo: vehiculoData.modelo ?? "",
                color: vehiculoData.color ?? "",
                tipo: vehiculoData.tipo as VehiculoForm["tipo"],
                kilometros_por_litro: vehiculoData.kilometros_por_litro ?? undefined,
                precio_litro_combustible:
                vehiculoData.precio_litro_combustible ?? undefined,
                capacidad_carga_kg: vehiculoData.capacidad_carga_kg ?? undefined,
                estado: vehiculoData.estado as VehiculoForm["estado"],
            });
            clearErrors();
        }

        // Si se abre en modo create, reseteamos el form
        if (open && mode === "create") {
            clearErrors();
            reset();
            setData((d) => ({ ...d,sucursal_id:sucursalId}));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, vehiculoData, mode]);

    //peticiones
    const handleSubmit  = (e:FormEvent) =>{
        e.preventDefault();

        if(mode == "edit" && vehiculoData){
            put(vehiculo.update(vehiculoData.id).url,{
                preserveScroll:true,
                onSuccess:()=>{
                    setOpen(false);
                },
                onError:(e)=>{
                    console.log(e);
                    
                }
            });
        }

        if(mode == "create"){
            post(vehiculo.store().url,{
                preserveScroll:true,
                onSuccess: () =>{
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

    //render
    return (
        <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleClose())}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                <DialogTitle>
                    {mode === "create" ? "Agregar vehículo" : "Editar vehículo"}
                </DialogTitle>
                <DialogDescription>
                    {mode === "create"
                    ? "Completa los datos del nuevo vehículo"
                    : "Modifica los datos del vehículo"}
                </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                {/* Placa */}
                <div className="grid gap-2">
                    <Label htmlFor="placa">Placa *</Label>
                    <Input
                    id="placa"
                    name="placa"
                    value={data.placa}
                    onChange={(e) => setData("placa", e.target.value)}
                    placeholder="Ej: ABC-123"
                    disabled={processing}
                    className={errors.placa ? "border-destructive" : ""}
                    />
                    {errors.placa && <p className="text-sm text-destructive">{errors.placa}</p>}
                </div>

                {/* Marca / Modelo */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                        id="marca"
                        name="marca"
                        value={data.marca}
                        onChange={(e) => setData("marca", e.target.value)}
                        placeholder="Ej: Toyota"
                        disabled={processing}
                        className={errors.marca ? "border-destructive" : ""}
                    />
                    {errors.marca && <p className="text-sm text-destructive">{errors.marca}</p>}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                        id="modelo"
                        name="modelo"
                        value={data.modelo}
                        onChange={(e) => setData("modelo", e.target.value)}
                        placeholder="Ej: Hilux"
                        disabled={processing}
                        className={errors.modelo ? "border-destructive" : ""}
                    />
                    {errors.modelo && <p className="text-sm text-destructive">{errors.modelo}</p>}
                    </div>
                </div>

                {/* Color / Tipo / Estado */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                        id="color"
                        name="color"
                        value={data.color ?? ""}
                        onChange={(e) => setData("color", e.target.value)}
                        placeholder="Ej: Blanco"
                        disabled={processing}
                        className={errors.color ? "border-destructive" : ""}
                    />
                    {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <select
                        id="tipo"
                        name="tipo"
                        value={data.tipo}
                        onChange={(e) => setData("tipo", e.target.value as any)}
                        disabled={processing}
                        className={`w-full rounded border px-2 py-1 ${errors.tipo ? "border-destructive" : ""}`}
                    >
                        <option value="camioneta">camioneta</option>
                        <option value="camion">camion</option>
                        <option value="pickup">pickup</option>
                        <option value="furgoneta">furgoneta</option>
                        <option value="trailer">trailer</option>
                        <option value="van">van</option>
                    </select>
                    {errors.tipo && <p className="text-sm text-destructive">{errors.tipo}</p>}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <select
                        id="estado"
                        name="estado"
                        value={data.estado}
                        onChange={(e) => setData("estado", e.target.value as any)}
                        disabled={processing}
                        className={`w-full rounded border px-2 py-1 ${errors.estado ? "border-destructive" : ""}`}
                    >
                        <option value="activo">activo</option>
                        <option value="mantenimiento">mantenimiento</option>
                        <option value="inactivo">inactivo</option>
                    </select>
                    {errors.estado && <p className="text-sm text-destructive">{errors.estado}</p>}
                    </div>
                </div>

                {/* Kilometros por litro / Precio litro / Capacidad (kg) */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="kilometros_por_litro">km / litro</Label>
                    <Input
                        id="kilometros_por_litro"
                        name="kilometros_por_litro"
                        type="number"
                        step="0.01"
                        value={data.kilometros_por_litro ?? ""}
                        onChange={(e) =>
                        setData(
                            "kilometros_por_litro",
                            e.target.value === "" ? undefined : Number(e.target.value)
                        )
                        }
                        placeholder="Ej: 12.5"
                        disabled={processing}
                        className={errors.kilometros_por_litro ? "border-destructive" : ""}
                    />
                    {errors.kilometros_por_litro && (
                        <p className="text-sm text-destructive">{errors.kilometros_por_litro}</p>
                    )}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="precio_litro_combustible">Precio / litro</Label>
                    <Input
                        id="precio_litro_combustible"
                        name="precio_litro_combustible"
                        type="number"
                        step="0.01"
                        value={data.precio_litro_combustible ?? ""}
                        onChange={(e) =>
                        setData(
                            "precio_litro_combustible",
                            e.target.value === "" ? undefined : Number(e.target.value)
                        )
                        }
                        placeholder="Ej: 24.50"
                        disabled={processing}
                        className={errors.precio_litro_combustible ? "border-destructive" : ""}
                    />
                    {errors.precio_litro_combustible && (
                        <p className="text-sm text-destructive">{errors.precio_litro_combustible}</p>
                    )}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="capacidad_carga_kg">Capacidad (kg)</Label>
                    <Input
                        id="capacidad_carga_kg"
                        name="capacidad_carga_kg"
                        type="number"
                        step="0.01"
                        value={data.capacidad_carga_kg ?? ""}
                        onChange={(e) =>
                        setData(
                            "capacidad_carga_kg",
                            e.target.value === "" ? undefined : Number(e.target.value)
                        )
                        }
                        placeholder="Ej: 1200"
                        disabled={processing}
                        className={errors.capacidad_carga_kg ? "border-destructive" : ""}
                    />
                    {errors.capacidad_carga_kg && (
                        <p className="text-sm text-destructive">{errors.capacidad_carga_kg}</p>
                    )}
                    </div>
                </div>

                {/* sucursal_id (hidden) */}
                <input type="hidden" name="sucursal_id" value={String(sucursalId)} />
                </div>

                <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                    Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={processing}>
                    {processing ? "Guardando..." : mode === "create" ? "Crear vehículo" : "Guardar cambios"}
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        );



}