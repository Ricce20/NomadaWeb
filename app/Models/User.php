<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    // Tipos de usuario
    const TYPE_SUPER_ADMIN = 'super_admin';
    const TYPE_OWNER = 'owner';
    const TYPE_MANAGER = 'manager';
    const TYPE_WAREHOUSEMAN = 'warehouse_man';
    const TYPE_DRIVER = 'driver';
    const TYPE_CLIENT = 'client'; // ← AGREGAR ESTA CONSTANTE
    
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'phone',
        'type',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function negocio()
    {
        return $this->hasMany(Negocio::class);
    }

    /**
     * Verificar si es de un tipo específico
     */
    public function isType(string $type): bool
    {
        return $this->type === $type;
    }

    public function sucursales(): BelongsToMany
    {
        return $this->belongsToMany(
            Sucursal::class,
            'sucursal_usuarios',
            'user_id',
            'sucursal_id'
        )->withTimestamps();
    }

    public function getBusinessId(): ?int
    {
        if ($this->isOwner()) {
            return $this->negocio()->pluck('id')->first();
        }

        // Para otros tipos de usuario, obtener el negocio de la primera sucursal
        $sucursal = $this->sucursales()->first();
        return $sucursal ? $sucursal->business_id : null;
    }

    /**
     * Obtener ruta de redirección según el tipo
     */
    public function getDashboardRouteName(): string
    {
        return match($this->type) {
            //manejan un layout unico
            self::TYPE_SUPER_ADMIN => 'management',
            self::TYPE_OWNER => 'ownership',
            //comparten layout pero diferente seccion
            self::TYPE_MANAGER => 'orders.index',
            self::TYPE_WAREHOUSEMAN => $this->getWarehousemanDashboard(),
            //no tienen dashboard, van al login
            default => 'login',
        };
    }

    /**
     * Obtener dashboard para warehouse_man
     */
    private function getWarehousemanDashboard(): string
    {
        // Obtener primera sucursal asignada
        $sucursal = $this->sucursales()->first();
        
        if ($sucursal) {
            // Redirigir al dashboard de inventario de su sucursal
            return "/sucursales/{$sucursal->id}/inventario";
        }
        
        // Si no tiene sucursal, ir a ownership
        return 'ownership';
    }

    /**
     * Helpers rápidos
     */
    public function isSuperAdmin(): bool { return $this->type === self::TYPE_SUPER_ADMIN; }
    public function isOwner(): bool { return $this->type === self::TYPE_OWNER; }
    public function isAdmin(): bool { return $this->type === self::TYPE_MANAGER; }
    public function isAlmacenista(): bool { return $this->type === self::TYPE_WAREHOUSEMAN; }
    public function isConductor(): bool { return $this->type === self::TYPE_DRIVER; }

    /**
     * Verificar si el usuario es dueño de una sucursal
     */
    public function ownsSucursal(Sucursal $sucursal): bool
    {
        if (!$this->isOwner()) {
            return false;
        }

        // Verificar que la sucursal pertenece al negocio del owner
        $negocioId = $this->negocio()->pluck('id')->first();
        return $negocioId && $sucursal->negocio_id === $negocioId;
    }

    /**
     * Verificar si el usuario gestiona una sucursal (manager asignado)
     */
    public function managesSucursal(Sucursal $sucursal): bool
    {
        if (!$this->isAdmin()) {
            return false;
        }

        // Verificar si el manager está asignado a la sucursal
        return $this->sucursales()->where('sucursales.id', $sucursal->id)->exists();
    }

    /**
     * Verificar si el usuario es almacenista de una sucursal
     */
    public function warehousesSucursal(Sucursal $sucursal): bool
    {
        if (!$this->isAlmacenista()) {
            return false;
        }

        // Verificar si el almacenista está asignado a la sucursal
        return $this->sucursales()->where('sucursales.id', $sucursal->id)->exists();
    }

    /**
     * Verificar si el usuario puede leer información de una sucursal
     */
    public function canReadSucursal(Sucursal $sucursal): bool
    {
        // Super admin puede leer todo
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Owner puede leer sus sucursales
        if ($this->ownsSucursal($sucursal)) {
            return true;
        }

        // Manager puede leer sucursales asignadas
        if ($this->managesSucursal($sucursal)) {
            return true;
        }

        // Warehouse puede leer sucursales asignadas
        if ($this->warehousesSucursal($sucursal)) {
            return true;
        }

        // Driver puede leer sucursales asignadas
        if ($this->isConductor() && $this->sucursales()->where('sucursales.id', $sucursal->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Generar un prefix único para los usernames basado en el negocio
     * Combina primeras letras del nombre + ID del negocio para garantizar unicidad
     * Ejemplo: "NOM002" para "Nomada" (ID 2), "CAF005" para "Café Bella" (ID 5)
     */
    public static function generateBusinessPrefix(int $negocioId): string
    {
        $negocio = Negocio::find($negocioId);
        
        if (!$negocio) {
            return 'USR' . str_pad($negocioId, 3, '0', STR_PAD_LEFT);
        }

        // Obtener las primeras 3 letras del nombre (sin espacios, convertidas a mayúsculas)
        $nombreLimpio = preg_replace('/[^a-zA-Z]/', '', $negocio->nombre);
        $iniciales = strtoupper(substr($nombreLimpio, 0, 3));
        
        // Si el nombre tiene menos de 3 letras, rellenar con asteriscos o letras del ID
        if (strlen($iniciales) < 3) {
            $iniciales = str_pad($iniciales, 3, '*');
        }
        
        // Agregar el ID del negocio formateado a 3 dígitos para garantizar unicidad
        $prefix = $iniciales . str_pad($negocioId, 3, '0', STR_PAD_LEFT);

        return $prefix;
    }
}
