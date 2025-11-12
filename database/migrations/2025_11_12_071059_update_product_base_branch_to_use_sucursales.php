<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected string $table = 'product_base_branch';

    public function up(): void
    {
        if (!Schema::hasTable($this->table)) return;

        // Ya está renombrado
        if (!Schema::hasColumn($this->table, 'branch_id') && Schema::hasColumn($this->table, 'sucursal_id')) {
            // Asegura índice único y llaves foráneas correctas
            $this->ensureConstraints();
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            Schema::table($this->table, function (Blueprint $table) {
                // Si existe FK antigua, elimínala antes del rename (nombres pueden variar)
                // Usa try/catch silencioso vía DB::statement() si tienes nombres dinámicos.
            });

            // Laravel soporta renameColumn en MySQL
            Schema::table($this->table, function (Blueprint $table) {
                if (Schema::hasColumn($this->table, 'branch_id')) {
                    $table->renameColumn('branch_id', 'sucursal_id');
                }
            });

            // Re-crear índices/constraints
            $this->ensureConstraints();
            return;
        }

        // === SQLITE / fallback ===
        // 1) Crear tabla nueva con el schema correcto
        Schema::create($this->table.'_new', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_base_id');
            $table->unsignedBigInteger('sucursal_id'); // <-- nuevo nombre
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->timestamps();

            $table->unique(['product_base_id','sucursal_id'], 'uniq_product_sucursal');

            // Nota: SQLite ignora ON DELETE hasta 3.38 en algunas configuraciones, pero definimos igual
            $table->foreign('product_base_id')->references('id')->on('product_bases')->onDelete('cascade');
            $table->foreign('sucursal_id')->references('id')->on('sucursales')->onDelete('cascade');
        });

        // 2) Copiar datos (branch_id → sucursal_id)
        $hasBranch = Schema::hasColumn($this->table, 'branch_id');
        $srcSucursalCol = $hasBranch ? 'branch_id' : 'sucursal_id';

        DB::statement("
            INSERT INTO {$this->table}_new (id, product_base_id, sucursal_id, price, stock, created_at, updated_at)
            SELECT id, product_base_id, {$srcSucursalCol} AS sucursal_id, price, stock, created_at, updated_at
            FROM {$this->table}
        ");

        // 3) Reemplazar tabla
        Schema::drop($this->table);
        Schema::rename($this->table.'_new', $this->table);
    }

    public function down(): void
    {
        if (!Schema::hasTable($this->table)) return;

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            if (Schema::hasColumn($this->table, 'sucursal_id')) {
                Schema::table($this->table, function (Blueprint $table) {
                    $table->renameColumn('sucursal_id', 'branch_id');
                });
            }
            return;
        }

        // SQLITE / fallback: recrear con branch_id
        Schema::create($this->table.'_old', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_base_id');
            $table->unsignedBigInteger('branch_id');
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->timestamps();

            $table->unique(['product_base_id','branch_id'], 'uniq_product_branch');

            $table->foreign('product_base_id')->references('id')->on('product_bases')->onDelete('cascade');
            // FK a branches si existiera; si no, omite o apunta a sucursales según tu histórico
        });

        DB::statement("
            INSERT INTO {$this->table}_old (id, product_base_id, branch_id, price, stock, created_at, updated_at)
            SELECT id, product_base_id, sucursal_id AS branch_id, price, stock, created_at, updated_at
            FROM {$this->table}
        ");

        Schema::drop($this->table);
        Schema::rename($this->table.'_old', $this->table);
    }

    protected function ensureConstraints(): void
    {
        // Asegurar índice único y FKs correctas tras el rename en MySQL
        // Como MySQL no permite manipular índices por nombre desconocido con Schema fácilmente,
        // ejecutamos guardas idempotentes.
        // ÍNDICE ÚNICO
        try { DB::statement("ALTER TABLE {$this->table} ADD UNIQUE INDEX uniq_product_sucursal (product_base_id, sucursal_id)"); } catch (\Throwable $e) {}

        // FK product_base_id
        try { DB::statement("ALTER TABLE {$this->table} ADD CONSTRAINT fk_pbb_product FOREIGN KEY (product_base_id) REFERENCES product_bases(id) ON DELETE CASCADE"); } catch (\Throwable $e) {}

        // FK sucursal_id
        try { DB::statement("ALTER TABLE {$this->table} ADD CONSTRAINT fk_pbb_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE"); } catch (\Throwable $e) {}
    }
};
