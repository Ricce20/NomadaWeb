<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable,SoftDeletes;

    // Tipos de usuario
    const TYPE_SUPER_ADMIN = 'super_admin';
    const TYPE_OWNER = 'owner';
    const TYPE_MANAGER = 'manager';
    const TYPE_WAREHOUSEMAN = 'warehouse_man';
    const TYPE_DRIVER = 'driver';
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
            self::TYPE_WAREHOUSEMAN => 'warehouse.index',
            //no tienen dashboard, van al login
            default => 'login',
        };
    }

    /**
     * Helpers rápidos
     */
    public function isSuperAdmin(): bool { return $this->type === self::TYPE_SUPER_ADMIN; }
    public function isOwner(): bool { return $this->type === self::TYPE_OWNER; }
    public function isAdmin(): bool { return $this->type === self::TYPE_MANAGER; }
    public function isAlmacenista(): bool { return $this->type === self::TYPE_WAREHOUSEMAN; }
    public function isConductor(): bool { return $this->type === self::TYPE_DRIVER; }
}
