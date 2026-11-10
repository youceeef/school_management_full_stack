<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Throwable;

class SendStaffVerificationLinks extends Command
{
    protected $signature = 'staff:send-verification
                            {--dry-run : List the recipients without sending anything}';

    protected $description = 'Send a fresh email verification link to pending staff applications that were created before verification existed';

    public function handle(): int
    {
        $query = User::query()
            ->whereIn('requested_role', User::APPROVAL_ROLES)
            ->where('approval_status', User::APPROVAL_PENDING)
            ->whereNull('email_verified_at');

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No pending staff application is waiting for email verification.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $query->orderBy('id')->each(function (User $user): void {
                $this->line("{$user->id}\t{$user->email}");
            });

            $this->info("{$total} pending staff application(s) would receive a verification link.");

            return self::SUCCESS;
        }

        $sent = 0;
        $failed = 0;

        $query->orderBy('id')->chunkById(100, function ($users) use (&$sent, &$failed): void {
            foreach ($users as $user) {
                try {
                    $user->sendEmailVerificationNotification();
                    $sent++;
                } catch (Throwable $exception) {
                    $failed++;
                    $this->error("Failed for {$user->email}: {$exception->getMessage()}");
                }
            }
        });

        $this->info("Verification links sent: {$sent}. Failed: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
