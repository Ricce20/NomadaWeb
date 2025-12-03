import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';


interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    defaultLoginMethod?: boolean; // true = empleado, false = no empleado
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    defaultLoginMethod = false,
}: LoginProps) {
    const [isEmployee, setIsEmployee] = useState<boolean>(defaultLoginMethod);

    return (
        <AuthLayout
            title="Inicia sesión en tu cuenta"
            description="Introduce tus credenciales para acceder a tu cuenta."
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-4">
                                <div>
                                    <Label>¿Eres empleado?</Label>
                                    <RadioGroup
                                        value={isEmployee ? 'yes' : 'no'}
                                        onValueChange={(value: string) => setIsEmployee(value === 'yes')}
                                        name="isEmployee"
                                        className="mt-2 flex flex-row space-x-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="is-employee-yes" />
                                            <Label htmlFor="is-employee-yes" className="cursor-pointer">
                                                Sí
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="is-employee-no" />
                                            <Label htmlFor="is-employee-no" className="cursor-pointer">
                                                No
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                {isEmployee ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Nombre de usuario</Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            name="username"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="username"
                                            placeholder="Tu nombre de usuario"
                                        />
                                        <p className='text-xs'>Ingresa tu nombre de usuario asignado</p>
                                        <InputError message={errors.username} />
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Correo electrónico</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="email@gmail.com"
                                        />
                                        <p className='text-xs'>Ejemplo:email@gmail.com</p>
                                        <InputError message={errors.email} />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    {canResetPassword && !isEmployee && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Tu contraseña"
                                />
                                <p className="text-xs">
                                    La contraseña distingue entre mayúsculas y minúsculas
                                </p>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Acuérdate de mí</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Iniciar sesión
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                No tienes una cuenta?{' '}
                                <TextLink href={register()} tabIndex={5} className='text-orange-600'>
                                    Registrate aqui
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
