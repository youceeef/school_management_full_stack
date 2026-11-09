"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr, enUS, arTN } from "date-fns/locale";
import { XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "../utils/toast";

const visibleLimit = 6;
const DATE_LOCALES = { fr, en: enUS, ar: arTN };

export default function NotificationDropdown({ isOpen, onClose }) {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { locale, tr, isRtl } = useLanguage();
  const [pendingId, setPendingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  if (!isOpen) return null;

  const formatDate = (date) => {
    const parsed = new Date(date);
    return isValid(parsed)
      ? formatDistanceToNow(parsed, { addSuffix: true, locale: DATE_LOCALES[locale] || fr })
      : tr("Date inconnue");
  };

  const handleOpen = async (notification) => {
    setPendingId(notification.id);
    try {
      if (!notification.read_at) await markAsRead(notification.id);
      onClose();
      if (notification.data?.action_url) router.push(notification.data.action_url);
    } catch (error) {
      console.error("Failed to open notification:", error);
      toast.error(tr("Impossible d’ouvrir la notification"));
    } finally {
      setPendingId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      toast.success(tr("Toutes les notifications ont été marquées comme lues"));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error(tr("Impossible de marquer les notifications comme lues"));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (event, notification) => {
    event.stopPropagation();
    setPendingId(notification.id);
    try {
      await deleteNotification(notification.id);
      toast.success(tr("Notification supprimée"));
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(tr("Impossible de supprimer la notification"));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      className={`absolute ${
        isRtl ? "left-0" : "right-0"
      } mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden z-40 flex flex-col border border-slate-200 dark:border-slate-800`}
    >
      <div className="py-3 px-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center gap-3">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {tr("Notifications")} {unreadCount > 0 && <span className="font-mono tabular-nums">({unreadCount})</span>}
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
            >
              {markingAll ? tr("Marquage...") : tr("Tout marquer comme lu")}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/70">
        {loading ? (
          <div className="px-4 py-8 text-xs text-slate-500 dark:text-slate-400 text-center">{tr("Chargement...")}</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <BellIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{tr("Aucune notification récente")}</p>
          </div>
        ) : (
          notifications.slice(0, visibleLimit).map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                !notification.read_at ? "bg-primary-50/40 dark:bg-primary-950/20" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => handleOpen(notification)}
                disabled={pendingId === notification.id}
                className="flex-1 min-w-0 px-4 py-3 text-start disabled:opacity-60"
              >
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 break-words leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{formatDate(notification.created_at)}</p>
              </button>
              <button
                type="button"
                onClick={(event) => handleDelete(event, notification)}
                disabled={pendingId === notification.id}
                className="m-2 p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                aria-label={tr("Supprimer la notification")}
                title={tr("Supprimer")}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="py-2.5 px-4 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/dashboard/notifications");
          }}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {tr("Voir toutes les notifications")}
        </button>
      </div>
    </div>
  );
}
