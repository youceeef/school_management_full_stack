"use client";

import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link"; // --- NEW: Import the Link component ---

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  if (!isOpen) return null;

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-md shadow-lg overflow-hidden z-20 flex flex-col">
      <div className="py-2 px-3 bg-gray-50 dark:bg-dark-border/20 border-b border-gray-100 dark:border-dark-border">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
          {Array.isArray(notifications) && notifications.length > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              Marquer comme lues
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">Chargement...</div>
        ) : !Array.isArray(notifications) || notifications.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">Aucune notification</div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border/20 border-b border-gray-100 dark:border-dark-border ${!notification.read_at ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
              <div className="flex justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-dark-text">{notification.data?.message || notification.message || "No message content"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.created_at ? formatDate(notification.created_at) : "No date"}</p>
                </div>
                <div className="flex items-start ml-2">
                  {!notification.read_at && (
                    <button onClick={() => markAsRead(notification.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1" title="Marquer comme lu">
                      ✓
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notification.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1" title="Supprimer">
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- NEW: Footer section with a link to the notifications page --- */}
      <div className="py-2 px-3 text-center border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-border/20">
        <Link href="/dashboard/notifications" onClick={onClose} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Voir toutes les notifications
        </Link>
      </div>
      {/* --- END OF NEW SECTION --- */}
    </div>
  );
}
