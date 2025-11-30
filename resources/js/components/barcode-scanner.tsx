import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    disabled?: boolean;
}

export function BarcodeScanner({ onScan, disabled = false }: BarcodeScannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'camera' | 'manual'>('manual');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanner = async () => {
        if (!containerRef.current) return;
        
        setError(null);
        setIsScanning(true);

        try {
            const scanner = new Html5Qrcode('barcode-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                },
                (decodedText) => {
                    handleScan(decodedText);
                },
                () => {} // Ignorar errores de escaneo continuo
            );
        } catch (err) {
            setError('No se pudo acceder a la cámara. Usa el modo manual.');
            setIsScanning(false);
            setMode('manual');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                // Ignorar errores al detener
            }
        }
        setIsScanning(false);
    };

    const handleScan = (barcode: string) => {
        stopScanner();
        onScan(barcode);
        setIsOpen(false);
        setManualCode('');
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleScan(manualCode.trim());
        }
    };

    useEffect(() => {
        if (isOpen && mode === 'camera') {
            // Pequeño delay para que el DOM se renderice
            setTimeout(startScanner, 100);
        }
        
        return () => {
            stopScanner();
        };
    }, [isOpen, mode]);

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            setManualCode('');
            setError(null);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                    <Camera className="h-4 w-4 mr-2" />
                    Escanear código
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Escanear código de barras</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Selector de modo */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={mode === 'manual' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setMode('manual'); stopScanner(); }}
                            className="flex-1"
                        >
                            <Keyboard className="h-4 w-4 mr-2" />
                            Manual
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'camera' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('camera')}
                            className="flex-1"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Cámara
                        </Button>
                    </div>

                    {mode === 'camera' ? (
                        <div className="space-y-3">
                            <div 
                                id="barcode-reader" 
                                ref={containerRef}
                                className="w-full h-64 bg-muted rounded-lg overflow-hidden"
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            {isScanning && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Apunta la cámara al código de barras...
                                </p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="manual-barcode">Código de barras</Label>
                                <Input
                                    id="manual-barcode"
                                    type="text"
                                    placeholder="Escribe o escanea con lector USB..."
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                                Buscar producto
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
