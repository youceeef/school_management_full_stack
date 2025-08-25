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
        Schema::create('equipement_reservation', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reservation_id')->constrained()->onDelete('cascade');
            $table->foreignId('equipement_id')->constrained()->onDelete('cascade');

            $table->integer('quantity')->default(1); // Optional: quantity of material used

            $table->timestamps();
            $table->unique(['reservation_id', 'equipement_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipement_reservation');
    }
};
