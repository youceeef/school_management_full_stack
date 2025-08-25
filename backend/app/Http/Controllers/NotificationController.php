<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $request->query('limit', 15);

        $notifications = $user->notifications()->latest()->paginate($limit);

        return response()->json($notifications);
    }

    /**
     * Get the count of unread notifications for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications->count(),
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, DatabaseNotification $notification): JsonResponse
    {
        // Authorization check: Ensure the notification belongs to the authenticated user
        if ($request->user()->id !== $notification->notifiable_id || $request->user()->getMorphClass() !== $notification->notifiable_type) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all unread notifications for the authenticated user as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);
        // Or: $request->user()->unreadNotifications->markAsRead(); (iterates and saves each)

        return response()->json(['message' => 'All unread notifications marked as read.']);
    }

    /**
     * Optional: Delete a specific notification.
     */
    public function destroy(Request $request, DatabaseNotification $notification): JsonResponse
    {
        // Authorization check
        if ($request->user()->id !== $notification->notifiable_id || $request->user()->getMorphClass() !== $notification->notifiable_type) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $notification->delete();
        return response()->json(['message' => 'Notification deleted.']);
    }
}
