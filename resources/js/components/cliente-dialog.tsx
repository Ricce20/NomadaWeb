import cliente from "@/routes/sucursal/cliente";
import { Cliente, ClienteForm } from "@/types";
import { useForm } from "@inertiajs/react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";


interface ClienteProps{
    trigger:ReactNode,
    clienteData?:Cliente | null,
    mode?:"create"|"edit"
}

export function ClienteDialog({trigger,clienteData = null,mode = "create"}:ClienteProps){
    const [open,setOpen] = useState(false);

    const {data, setData, put,post,processing,errors,reset,clearErrors} = useForm<ClienteForm>({
        nombre: clienteData?.nombre ?? "",
        apellidos: clienteData?.apellidos??"",
        telefono: clienteData?.telefono??"",
        activo: clienteData?.activo ?? true
    });

    useEffect(() =>{
        if(open && clienteData){
            setData({
                nombre: clienteData.nombre ?? "",
                apellidos: clienteData.apellidos ?? "",
                telefono: clienteData.telefono??"",
                activo: clienteData.activo,
            });
            clearErrors();
        }
        if(open && mode==="create"){
            clearErrors();
            reset();
            setData((d) => ({...d}));
        }
    },[open,clienteData,mode]);

    //peticiones

    const handleSubmit = (e:FormEvent) => {
        e.preventDefault();

        if(mode ==="edit" && clienteData){
            put(cliente.update(clienteData.id).url,{
                preserveScroll:true,
                onSuccess:()=>{
                    setOpen(false);
                },
                onError: (e) =>{
                    console.log(e);
                    
                }
            });

        }

        if(mode === "create"){
            post(cliente.store().url,{
                preserveScroll:true,
                onSuccess:()=>{
                    reset();
                    setOpen(false);
                }
            });
        }
    }

    const handleClose = () => {
        setOpen(false);
        clearErrors();
        if (mode === "create") {
            reset();
            // reestablecer el tipo al default
            setData((d) => ({ ...d}));
        }

    }

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
                {/* Nombre */}
                <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                    id="nombre"
                    name="nombre"
                    value={data.nombre}
                    onChange={(e) => setData("nombre", e.target.value)}
                    placeholder="Ej: Jesus"
                    disabled={processing}
                    className={errors.nombre ? "border-destructive" : ""}
                    />
                    {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
                </div>

                {/* Apellidos*/}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="marca">Apellidos *</Label>
                    <Input
                        id="apellidos"
                        name="apellidos"
                        value={data.apellidos}
                        onChange={(e) => setData("apellidos", e.target.value)}
                        placeholder="Ej: Rivera Cervantes"
                        disabled={processing}
                        className={errors.apellidos ? "border-destructive" : ""}
                    />
                    {errors.apellidos && <p className="text-sm text-destructive">{errors.apellidos}</p>}
                    </div>

                    <div className="grid gap-2">
                    <Label htmlFor="modelo">Telefono *</Label>
                    <Input
                        id="telefono"
                        name="telefono"
                        value={data.telefono}
                        onChange={(e) => setData("telefono", e.target.value)}
                        placeholder="Ej: Hilux"
                        disabled={processing}
                        className={errors.telefono ? "border-destructive" : ""}
                    />
                    {errors.telefono && <p className="text-sm text-destructive">{errors.telefono}</p>}
                    </div>

                        {/* Estado Activo */}
                        <div className="flex items-center gap-3">
                        <input
                            id="activo"
                            name="activo"
                            type="checkbox"
                            checked={data.activo}
                            onChange={(e) => setData("activo", e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <Label htmlFor="activo" className="cursor-pointer">
                            Cliente activo
                        </Label>
                        </div>
                    </div>
            </div>

                

                

                <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                    Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={processing}>
                    {processing ? "Guardando..." : mode === "create" ? "Registrar Cliente" : "Guardar cambios"}
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        );
}