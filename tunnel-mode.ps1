# Script para cambiar entre modo local y tunnel
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "tunnel")]
    [string]$Mode
)

$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = Get-Location }

if ($Mode -eq "tunnel") {
    Write-Host "Activando modo TUNNEL (dev.yeremi.work)..." -ForegroundColor Cyan
    Copy-Item "$projectRoot\.env.tunnel" "$projectRoot\.env" -Force
    Copy-Item "$projectRoot\vite.config.tunnel.ts" "$projectRoot\vite.config.ts" -Force
    Write-Host ""
    Write-Host "Configuracion aplicada. Ahora ejecuta en 3 terminales:" -ForegroundColor Green
    Write-Host "  1. php artisan serve --host=127.0.0.1 --port=8000"
    Write-Host "  2. npm run dev"
    Write-Host "  3. cloudflared tunnel run nomada-local"
    Write-Host ""
    Write-Host "Accede a: https://dev.yeremi.work" -ForegroundColor Yellow
} else {
    Write-Host "Activando modo LOCAL..." -ForegroundColor Cyan
    Copy-Item "$projectRoot\.env.local" "$projectRoot\.env" -Force
    # Restaurar vite.config.ts original
    $viteLocal = @"
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    server: {
        host: '127.0.0.1',     // ← obliga a IPv4
        port: 5173,
        strictPort: true,
        hmr: {
            host: '127.0.0.1', // ← nada de [::]
            protocol: 'ws',
            port: 5173,
        }
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});
"@
    $viteLocal | Out-File "$projectRoot\vite.config.ts" -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "Configuracion aplicada. Ejecuta:" -ForegroundColor Green
    Write-Host "  1. php artisan serve"
    Write-Host "  2. npm run dev"
    Write-Host ""
    Write-Host "Accede a: http://localhost:8000" -ForegroundColor Yellow
}
