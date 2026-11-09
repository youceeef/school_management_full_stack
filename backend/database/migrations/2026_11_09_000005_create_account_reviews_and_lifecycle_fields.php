<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('requested_role');
            $table->timestamp('suspended_at')->nullable()->after('reviewed_at');
        });

        Schema::create('account_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('reviewer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('action', 30); // approved, rejected, suspended, reactivated, resubmitted
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);
            $table->text('reason')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_reviews');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason', 'suspended_at']);
        });
    }
};
