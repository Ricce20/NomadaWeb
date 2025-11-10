// Components/EmpleadoDialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";
import { Empleado as EmpleadoType } from "@/types";
import { FormEvent, ReactNode, useState } from "react";
import empleado from "@/routes/sucursal/empleado";

interface EmpleadoDialogProps {
  trigger: ReactNode;
  empleadoData?: EmpleadoType | null;
  sucursalId: number | string;
  mode?: "create" | "edit";
}

export function EmpleadoDialog({
  trigger,
  empleadoData = null,
  sucursalId,
  mode = "create",
}: EmpleadoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: empleadoData?.nombre || "",
    apellidos: empleadoData?.apellidos || "",
    edad: empleadoData?.edad || "",
    telefono: empleadoData?.telefono || "",
    activo: empleadoData?.activo ?? true,
    sucursalId : sucursalId
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const url = mode === "create" 
      ? empleado.store()
      : empleado.update(empleadoData!.id).url;

    const method = mode === "create" ? "post" : "put";

    router[method](
      url,
      {
        ...formData,
        sucursal_id: sucursalId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          // Resetear formulario solo en modo creación
          if (mode === "create") {
            setFormData({
              nombre: "",
              apellidos: "",
              edad: "",
              telefono: "",
              activo: true,
              sucursalId
            });
          }
        },
        onError: (errors) => {
          console.error("Error al guardar empleado:", errors);
        },
      }
    );
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Agregar nuevo empleado" : "Editar empleado"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Completa los datos del nuevo empleado. Haz clic en guardar cuando termines."
                : "Modifica los datos del empleado. Haz clic en guardar cuando termines."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-3">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: Juan"
                required
              />
            </div>

            {/* Apellidos */}
            <div className="grid gap-3">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleInputChange("apellidos", e.target.value)}
                placeholder="Ej: Pérez García"
              />
            </div>

            {/* Edad */}
            <div className="grid gap-3">
              <Label htmlFor="edad">Edad</Label>
              <Input
                id="edad"
                name="edad"
                type="number"
                min="18"
                max="100"
                value={formData.edad}
                onChange={(e) => handleInputChange("edad", e.target.value)}
                placeholder="Ej: 25"
              />
            </div>

            {/* Teléfono */}
            <div className="grid gap-3">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="Ej: 3312345678"
              />
            </div>

            {/* Estado Activo */}
            <div className="flex items-center gap-3">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => handleInputChange("activo", e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="activo" className="cursor-pointer">
                Empleado activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">
              {mode === "create" ? "Crear empleado" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}