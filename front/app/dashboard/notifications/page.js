"use client";

import React from "react";
import Link from "next/link";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useNotifications } from "../../context/NotificationContext";
import {
  BellIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  TrashIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsPageWrapper() {
  return <NotificationsPage />;
}

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    readCount,
    totalCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const formatDate = (date) => {
    const parsed = new Date(date);
    if (!date || !isValid(parsed)) return "—";
    return formatDistanceToNow(parsed, { addSuffix: true, locale: fr });
  };

  const handleDelete = async (notificationId) => {
    const notificationToDelete = notifications.find((n) => n.id === notificationId);
    if (!notificationToDelete) return;

    const truncatedMessage =
      notificationToDelete.message.length > 50
        ? `${notificationToDelete.message.substring(0, 50)}...`
        : notificationToDelete.message;

    try {
      await toast.confirmDelete(
        `Êtes-vous sûr de vouloir supprimer cette notification : "${truncatedMessage}" ?`,
        () => deleteNotification(notificationId),
        {
          loading: "Suppression en cours...",
          success: "Notification supprimée avec succès.",
          error: "Impossible de supprimer la notification.",
        }
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await toast.promise(markAsRead(notificationId), {
        loading: "Marquage en cours...",
        success: "Notification marquée comme lue.",
        error: "Impossible de marquer la notification comme lue.",
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const columns = [
    {
      header: "Message",
      accessor: "message",
      render: (row) => (
        <div className="flex items-start gap-3.5">
          <div
            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
              !row.read_at
                ? "bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-primary-200/70 dark:border-primary-900/60"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {!row.read_at ? (
              <BellIcon className="w-4 h-4" />
            ) : (
              <EnvelopeOpenIcon className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <span
              className={`block text-sm break-words ${
                !row.read_at
                  ? "font-medium text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {row.message}
            </span>
            {row.data?.action_url && (
              <Link
                href={row.data.action_url}
                className="mt-1 inline-flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Consulter les détails
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Réception",
      accessor: "created_at",
      render: (row) => (
        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      header: "État",
      accessor: "read_at",
      render: (row) =>
        !row.read_at ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary-700 dark:text-primary-300">
            <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
            Non lue
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Lue
          </span>
        ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {!row.read_at && (
            <button
              type="button"
              onClick={() => handleMarkAsRead(row.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
              title="Marquer comme lue"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
            title="Supprimer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const readPercentage = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  const statsCards = [
    {
      title: "Total des notifications",
      value: totalCount.toLocaleString("fr-FR"),
      icon: BellIcon,
    },
    {
      title: "Notifications non lues",
      value: unreadCount.toLocaleString("fr-FR"),
      icon: EnvelopeOpenIcon,
    },
    {
      title: "Taux de lecture",
      value: `${readPercentage}%`,
      icon: CheckBadgeIcon,
    },
  ];

  const handleMarkAllAsRead = async () => {
    try {
      await toast.promise(markAllAsRead(), {
        loading: "Marquage en cours...",
        success: "Toutes les notifications ont été marquées comme lues.",
        error: "Une erreur est survenue.",
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de notifications"
        description="Suivez les validations de réservations, nouveaux comptes et alertes système."
        actions={[
          {
            children: "Tout marquer comme lu",
            icon: CheckCircleIcon,
            variant: "primary",
            onClick: handleMarkAllAsRead,
            disabled: unreadCount === 0 || loading,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      <Card title="Historique des notifications" subtitle="Classées de la plus récente à la plus ancienne">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-14">
            <BellIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Vous n&apos;avez aucune notification
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Les mises à jour concernant vos réservations apparaîtront ici.
            </p>
          </div>
        ) : (
          <DataTable columns={columns} data={notifications} searchable={false} />
        )}
      </Card>
    </div>
  );
}
