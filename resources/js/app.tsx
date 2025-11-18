import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from '@/components/ui/toaster';
import axios from 'axios';

const token = document
    .querySelector("meta[name='csrf-token']")
    ?.getAttribute('content') || '';
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== ErrorBoundary para evitar pantalla negra =====
class ErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error?: any }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, info: any) {
        console.error('UI Crash:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900">
                    <div className="max-w-xl w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h1 className="text-xl font-semibold mb-2">
                            Algo salió mal en la UI
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
                            Revisa la consola del navegador para detalles. Si
                            es una ruta de Inertia no encontrada o un import
                            roto, aquí verás una pista.
                        </p>
                        {this.state.error && (
                            <pre className="text-xs overflow-auto p-3 rounded bg-zinc-900 text-zinc-100">
                                {String(
                                    this.state.error?.message ||
                                        this.state.error,
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ===== Resolver robusto de páginas (soporta pages/Pages y tsx/jsx) =====
const pages = {
    ...import.meta.glob('./pages/**/*.tsx', { eager: true }),
    ...import.meta.glob('./Pages/**/*.tsx', { eager: true }),
    ...import.meta.glob('./pages/**/*.jsx', { eager: true }),
    ...import.meta.glob('./Pages/**/*.jsx', { eager: true }),
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        // Inertia::render('sucursales/productos/Index') → buscamos una key que termine así
        const match = Object.keys(pages).find(
            (k) => k.endsWith(`/${name}.tsx`) || k.endsWith(`/${name}.jsx`),
        );
        if (!match) {
            console.error('[Inertia] Página no encontrada:', name, {
                available: Object.keys(pages),
            });
            throw new Error(`Inertia page not found: ${name}`);
        }
        // @ts-ignore
        const mod = pages[match];
        // Varios bundlers exportan .default, nos aseguramos
        const component = (mod as any)?.default ?? mod;
        if (!component) {
            console.error('[Inertia] Módulo sin default export:', name, mod);
            throw new Error(`Inertia module has no default export: ${name}`);
        }
        return component;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <ErrorBoundary>
                    <App {...props} />
                    <Toaster />
                </ErrorBoundary>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
