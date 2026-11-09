<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('proof_document_path', 500)->nullable()->after('professional_phone');
            $table->string('proof_document_name', 255)->nullable()->after('proof_document_path');
            $table->string('proof_document_mime', 100)->nullable()->after('proof_document_name');
            $table->unsignedBigInteger('proof_document_size')->nullable()->after('proof_document_mime');
            $table->timestamp('proof_submitted_at')->nullable()->after('proof_document_size');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'proof_document_path',
                'proof_document_name',
                'proof_document_mime',
                'proof_document_size',
                'proof_submitted_at',
            ]);
        });
    }
};
