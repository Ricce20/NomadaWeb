import HeadingSmall from "@/components/heading-small";
import InputError from "@/components/input-error";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";
import { BreadcrumbItem } from "@/types";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, Textarea, Transition } from '@headlessui/react';
import { Form, Head, useForm } from '@inertiajs/react';
import { business } from "@/routes/settings";
import {update,updateImage} from "@/actions/App/Http/Controllers/Settings/NegocioController";
import { FieldLabel, FieldSet } from "@/components/ui/field";
import { useState, ChangeEvent, FormEvent } from 'react';
import { Upload, X } from 'lucide-react';
import Heading from "@/components/heading";

interface MyBusinessProps {
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  logo?: string | null; // URL de la imagen actual
  activo: boolean;
  descripcion?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mi negocio información',
        href: business().url,
    },
];

export default function MiNegocio({data}: {data: MyBusinessProps}) {
    const [preview, setPreview] = useState<string>(data.logo ?? '');
    
    const { data: formData, setData, post, processing, recentlySuccessful, errors } = useForm({
        logo: null as File | null,
    });

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setData('logo', file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('logo', null);
        setPreview('');
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(updateImage().url, {
            preserveScroll: true,
        });
    };
   
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Acerca de mi negocio" />

            <SettingsLayout>
                <div className="space-y-6"> 
                    <div className="border-2 border-primary border-dashed rounded-lg p-4 space-y-4 dark:border-foreground">
                        <HeadingSmall
                            title="Mi negocio información"
                            description="Aquí puedes ver la información de tu negocio"
                        />

                        {!data.activo && (
                            <div className="bg-cyan-900 text-white p-4 rounded">
                                <p className="font-semibold">Tu negocio no está activo.</p>
                                <p>Completa los campos de identificación para poder estar activo</p>
                            </div>
                        )}

                        {data.activo && (
                            <div className="bg-green-400 text-white p-4 rounded">
                                <p className="text-sm text-neutral-600">Tu negocio está activo.</p>
                            </div>
                        )}
                    </div>
                    

                    {/* Formulario de la imagen del negocio */}
                    <form onSubmit={handleSubmit} className="space-y-6 border-2 border-primary border-dashed rounded-lg p-4 dark:border-foreground " >
                        <div className="grid gap-2">
                            <Label htmlFor="logo">Logo del negocio</Label>
                            
                            {!preview ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-900 transition">
                                    <input
                                        type="file"
                                        id="logo"
                                        name="logo"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="logo"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                        <span className="text-neutral-600 font-medium mb-1">
                                            Selecciona el logo
                                        </span>
                                        <span className="text-sm text-neutral-500">
                                            PNG, JPG, GIF
                                        </span>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                                    <img
                                        src={preview}
                                        alt="Logo del negocio"
                                        className="w-full h-64 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <p className="text-white text-sm font-medium truncate">
                                            {formData.logo?.name || 'Logo actual'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            <InputError message={errors.logo} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={processing || !formData.logo}
                            >
                                {processing ? 'Guardando...' : 'Guardar logo'}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">
                                    Guardado correctamente
                                </p>
                            </Transition>
                        </div>
                    </form>


                    <Form 
                        className="space-y-6 border-2 border-primary border-dashed rounded-lg p-4 dark:border-foreground"
                        action={update()}
                        options={{
                            preserveScroll: true,
                        }}
                    >
                        
                        {({ processing, recentlySuccessful, errors }) => (
                        <>
                        <HeadingSmall
                            title="Datos sobre mi negocio"
                            description="Aquí puedes ver la información de tu negocio"
                        />
                            
                            <div className="grid gap-2">
                                <Label htmlFor="nombre">Nombre del negocio</Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    className="mt-1 block w-full"
                                    defaultValue={data.nombre ?? ''}
                                    type="text"
                                    required
                                    autoComplete="nombre"
                                    placeholder="Nombre del negocio"
                                />
                                <InputError message={errors.nombre} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <FieldSet>
                                    <Field>
                                        <FieldLabel htmlFor="nombre">Descripcion del negocio</FieldLabel>
                                        <Textarea
                                            id="description"
                                            className="mt-1 block w-full border rounded-md border-amber-50 p-3"
                                            defaultValue={data.descripcion ?? ''}
                                            rows={4}
                                            autoComplete="descripcion"
                                            placeholder="Descripción del negocio"
                                            name="descripcion"
                                        />
                                    </Field>
                                </FieldSet>
                                <InputError message={errors.descripcion} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="correo">Correo general del negocio</Label>
                                <Input
                                    id="correo"
                                    name="correo"
                                    className="mt-1 block w-full"
                                    defaultValue={data.correo ?? ''}
                                    type="email"
                                    required
                                    autoComplete="correo"
                                    placeholder="Ejemplo: minegocio@gmail.com"
                                />
                                <InputError message={errors.correo} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input 
                                    id="telefono"
                                    name="telefono"
                                    className="mt-1 block w-full"
                                    defaultValue={data.telefono ?? ''}
                                    type="tel"
                                    required
                                    autoComplete="telefono"
                                    placeholder="Teléfono"
                                />
                                <InputError message={errors.telefono} className="mt-2" />
                            </div>


                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {processing ? 'Guardando...' : 'Guardar'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        Guardado correctamente
                                    </p>
                                </Transition>
                            </div>
                        </>
                        )}
                        
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}