// components/flash-messages.tsx
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { SharedData } from '@/types';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const newToasts: Toast[] = [];

        if (flash.success) {
            newToasts.push({
                id: Date.now() + 1,
                message: flash.success,
                type: 'success'
            });
        }
        if (flash.error) {
            newToasts.push({
                id: Date.now() + 2,
                message: flash.error,
                type: 'error'
            });
        }
        if (flash.warning) {
            newToasts.push({
                id: Date.now() + 3,
                message: flash.warning,
                type: 'warning'
            });
        }
        if (flash.info) {
            newToasts.push({
                id: Date.now() + 4,
                message: flash.info,
                type: 'info'
            });
        }

        if (newToasts.length > 0) {
            setToasts(prev => [...prev, ...newToasts]);

            // Auto-remover después de 5 segundos
            newToasts.forEach(toast => {
                setTimeout(() => {
                    removeToast(toast.id);
                }, 5000);
            });
        }
    }, [flash]);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const getAlertConfig = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return {
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    className: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                };
            case 'error':
                return {
                    variant: 'destructive' as const,
                    icon: XCircle,
                    className: 'border-red-800 bg-red-700 text-card'
                };
            case 'warning':
                return {
                    variant: 'default' as const,
                    icon: AlertCircle,
                    className: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                };
            case 'info':
                return {
                    variant: 'default' as const,
                    icon: Info,
                    className: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                };
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full">
            {toasts.map(toast => {
                const config = getAlertConfig(toast.type);
                const Icon = config.icon;

                return (
                    <Alert
                        key={toast.id}
                        variant={config.variant}
                        className={`${config.className} shadow-lg animate-in slide-in-from-right duration-300 relative pr-12`}
                    >
                        <Icon className="h-4 w-4" />
                        <AlertTitle className="font-semibold">
                            {toast.type === 'success' && 'Éxito'}
                            {toast.type === 'error' && 'Error'}
                            {toast.type === 'warning' && 'Advertencia'}
                            {toast.type === 'info' && 'Información'}
                        </AlertTitle>
                        <AlertDescription className="text-sm text-foreground">
                            {toast.message}
                        </AlertDescription>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="absolute top-3 right-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cerrar</span>
                        </button>
                    </Alert>
                );
            })}
        </div>
    );
}