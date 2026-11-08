"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotifications } from "../context/NotificationContext";
import toast from "../utils/toast";

const visibleLimit = 6;

export default function NotificationDropdown({ isOpen, onClose }) {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [pendingId, setPendingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  if (!isOpen) return null;

  const formatDate = (date) => {
    const parsed = new Date(date);
    return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true, locale: fr }) : "Date inconnue";
  };

  const handleOpen = async (notification) => {
    setPendingId(notification.id);
    try {
      if (!notification.read_at) await markAsRead(notification.id);
      onClose();
      if (notification.data?.action_url) router.push(notification.data.action_url);
    } catch (error) {
      console.error("Failed to open notification:", error);
      toast.error("Impossible d’ouvrir la notification");
    } finally {
      setPendingId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Impossible de marquer les notifications comme lues");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (event, notification) => {
    event.stopPropagation();
    setPendingId(notification.id);
    try {
      await deleteNotification(notification.id);
      toast.success("Notification supprimée");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Impossible de supprimer la notification");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-lg shadow-xl overflow-hidden z-40 flex flex-col border border-gray-200 dark:border-dark-border">
      <div className="py-3 px-4 bg-gray-50 dark:bg-dark-border/20 border-b border-gray-100 dark:border-dark-border">
        <div className="flex justify-between items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {markingAll ? "Marquage..." : "Tout marquer comme lu"}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">Aucune notification</div>
        ) : (
          notifications.slice(0, visibleLimit).map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/20 ${
                !notification.read_at ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => handleOpen(notification)}
                disabled={pendingId === notification.id}
                className="flex-1 min-w-0 px-4 py-3 text-left disabled:opacity-60"
              >
                <p className="text-sm text-gray-800 dark:text-dark-text break-words">{notification.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
              </button>
              <button
                type="button"
                onClick={(event) => handleDelete(event, notification)}
                disabled={pendingId === notification.id}
                className="m-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                aria-label="Supprimer la notification"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="py-3 px-4 text-center border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-border/20">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/dashboard/notifications");
          }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voir toutes les notifications
        </button>
      </div>
    </div>
  );
}
