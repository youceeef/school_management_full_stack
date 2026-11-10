<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Accounts that were already reviewed before email verification existed are
     * treated as verified so they keep working. Pending applications are left
     * unverified on purpose: they must confirm ownership before an admin sees
     * them, and `php artisan staff:send-verification` emails them a link.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->where('approval_status', '!=', 'pending')
            ->update(['email_verified_at' => now()]);
    }

    /**
     * Irreversible by design: clearing the timestamps again would silently
     * un-verify real production accounts.
     */
    public function down(): void
    {
        //
    }
};
