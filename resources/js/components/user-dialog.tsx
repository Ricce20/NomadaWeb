// Components/UsuarioDialog.tsx
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
import { useForm } from "@inertiajs/react";
import { User } from "@/types";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import usuario from "@/routes/sucursal/usuario";

interface UsuarioDialogProps {
  trigger: ReactNode;
  usuarioData?: User | null;
  sucursalId: string | number;
  mode?: "create" | "edit";
}

const tiposUsuario = [
  { value: "manager", label: "Gerente" },
  { value: "warehouse_man", label: "Almacenista" },
  { value: "driver", label: "Conductor" },
];

type UsuarioForm = {
  name: string;
  username: string;
  type: string;
  password: string;
  password_confirmation: string;
  sucursal_id: string | number;
};

export function UsuarioDialog({
  trigger,
  usuarioData = null,
  sucursalId,
  mode = "create",
}: UsuarioDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    data,
    setData,
    post,
    put,
    processing,
    errors,
    reset,
    clearErrors,
  } = useForm<UsuarioForm>({
    name: usuarioData?.name || "",
    username: usuarioData?.username || "",
    // si viene usuarioData.type úsalo, sino por defecto el primer tipo
    type: usuarioData?.type || tiposUsuario[0].value,
    password: "",
    password_confirmation: "",
    sucursal_id: sucursalId,
  });

  // sincronizar cuando cambie usuarioData (por ejemplo al abrir en modo edit)
  useEffect(() => {
    if (mode === "edit" && usuarioData) {
      setData({
        name: usuarioData.name ?? "",
        username: usuarioData.username ?? "",
        type: usuarioData.type ?? tiposUsuario[0].value,
        password: "",
        password_confirmation: "",
        sucursal_id: sucursalId,
      });
      clearErrors();
    } else if (mode === "create") {
      // asegurar sucursal_id en modo create
      setData((d) => ({ ...d, sucursal_id: sucursalId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioData, sucursalId, mode]);
  

  const firstError = (field: any) =>
    Array.isArray(field) ? field[0] : (field as string | undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && usuarioData) {
      put(usuario.update(usuarioData.id).url, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
        },
      });
    } else {
      post(usuario.store().url, {
        preserveScroll: true,
        onError:(e)=>{
          console.log(e);
          
        },
        onSuccess: () => {
          // resetear campos sensibles pero mantener sucursal_id por si se abre de nuevo
          reset("name", "username", "type", "password", "password_confirmation");
          setOpen(false);
        },
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    clearErrors();
    // opcional: al cerrar en modo create, limpiar inputs
    if (mode === "create") {
      reset("name", "username", "type", "password", "password_confirmation");
      // reestablecer el tipo al default
      setData((d) => ({ ...d, type: tiposUsuario[0].value }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Agregar nuevo usuario" : "Editar usuario"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Completa los datos del nuevo usuario. La contraseña debe tener al menos 8 caracteres."
                : "Modifica los datos del usuario. Deja la contraseña en blanco si no deseas cambiarla."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre completo */}
            <div className="grid gap-3">
              <Label htmlFor="name">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                placeholder="Ej: Juan Pérez García"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{firstError(errors.name)}</p>
              )}
            </div>

            {/* Username */}
            <div className="grid gap-3">
              <Label htmlFor="username">
                Nombre de usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                value={data.username}
                onChange={(e) => setData("username", e.target.value)}
                placeholder="Ej: juanperez"
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{firstError(errors.username)}</p>
              )}
            </div>

            {/* Tipo de usuario */}
            <div className="grid gap-3">
              <Label htmlFor="type">
                Tipo de usuario <span className="text-red-500">*</span>
              </Label>
              <select
                id="type"
                name="type"
                value={data.type}
                onChange={(e) => setData("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {tiposUsuario.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{firstError(errors.type)}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="grid gap-3">
              <Label htmlFor="password">
                Contraseña {mode === "create" && <span className="text-red-500">*</span>}
                {mode === "edit" && (
                  <span className="text-sm text-muted-foreground ml-2">(opcional)</span>
                )}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{firstError(errors.password)}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="grid gap-3">
              <Label htmlFor="password_confirmation">
                Confirmar contraseña {mode === "create" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                placeholder="Repite la contraseña"
                className={errors.password_confirmation ? "border-red-500" : ""}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-red-500">
                  {firstError(errors.password_confirmation)}
                </p>
              )}
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
