<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class UpdateReservationStatuses extends Command
{
    protected $signature = 'reservations:update-statuses';
    protected $description = 'Update reservation statuses based on their time';

    public function handle()
    {
        try {
            $now = Carbon::now();

            // Update approved reservations to in_progress
            $updatedToInProgress = Reservation::where('status', Reservation::STATUS_APPROVED)
                ->where('start_time', '<=', $now)
                ->where('end_time', '>', $now)
                ->update(['status' => Reservation::STATUS_IN_PROGRESS]);

            // Update in_progress reservations to completed
            $updatedToCompleted = Reservation::where('status', Reservation::STATUS_IN_PROGRESS)
                ->where('end_time', '<=', $now)
                ->update(['status' => Reservation::STATUS_COMPLETED]);

            $this->info("Updated {$updatedToInProgress} reservations to in_progress");
            $this->info("Updated {$updatedToCompleted} reservations to completed");

            Log::info("Reservation status update completed", [
                'to_in_progress' => $updatedToInProgress,
                'to_completed' => $updatedToCompleted
            ]);

            return 0;
        } catch (\Exception $e) {
            Log::error("Error updating reservation statuses: " . $e->getMessage());
            $this->error("Error updating reservation statuses: " . $e->getMessage());
            return 1;
        }
    }
}
