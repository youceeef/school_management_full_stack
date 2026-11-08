<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'in_progress', 'completed') DEFAULT 'pending'");
        } elseif (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check');
            DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed'))");
        }

        // SQLite cannot alter check constraints without rebuilding the table.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        } elseif (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check');
            DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'approved', 'rejected'))");
        }
    }
};
