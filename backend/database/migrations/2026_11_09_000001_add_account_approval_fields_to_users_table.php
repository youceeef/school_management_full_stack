<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Existing accounts remain approved. Only new teacher and
            // laboratory-manager applications enter the pending workflow.
            $table->string('approval_status', 20)->default('approved')->after('bio');
            $table->string('requested_role', 100)->nullable()->after('approval_status');
            $table->timestamp('reviewed_at')->nullable()->after('requested_role');
            $table->foreignId('reviewed_by')
                ->nullable()
                ->after('reviewed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['approval_status', 'requested_role']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['approval_status', 'requested_role']);
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['approval_status', 'requested_role', 'reviewed_at']);
        });
    }
};
