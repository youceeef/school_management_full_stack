<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('institution', 255)->nullable()->after('bio');
            $table->string('department', 255)->nullable()->after('institution');
            $table->string('staff_id', 100)->nullable()->after('department');
            $table->string('professional_phone', 30)->nullable()->after('staff_id');

            $table->index(['institution']);
            $table->index(['staff_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['users_institution_index']);
            $table->dropIndex(['users_staff_id_index']);
            $table->dropColumn([
                'institution',
                'department',
                'staff_id',
                'professional_phone',
            ]);
        });
    }
};
