import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            {/* Header */}
            <header className="w-full border-b border-border bg-card py-4 px-6">
                <div className="flex items-center justify-between">
                    <a
                        href="/"
                        className="flex items-center gap-3 font-medium text-card-foreground hover:text-primary transition-colors"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md">
                            <AppLogoIcon className="size-8 fill-current text-primary" />
                        </div>
                        <span className="text-lg font-semibold">Nomada</span>
                    </a>
                    
                    <nav className="flex items-center gap-6">
                        <a
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Volver al sitio
                        </a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8 border border-border bg-card p-8 rounded-xl shadow-lg">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <AppLogoIcon className="size-8 fill-current text-primary" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </div>

                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-bold text-card-foreground">
                                    {title}
                                </h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full border-t border-border bg-card py-4 px-6">
                <div className="flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                        © 2025 Nomada. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}