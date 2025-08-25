"use client";

import React from "react";
import toast from "../../utils/toast"; // Your custom toast is imported
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useNotifications } from "../../context/NotificationContext";
import { BellIcon, EnvelopeOpenIcon, CheckCircleIcon, TrashIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import ProtectedRoute from "../../components/ProtectedRoute";
import PermissionGate from "../../components/PermissionGate";
import { PERMISSIONS } from "../../constants/permissions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsPageWrapper() {
  return (
    // <ProtectedRoute permission={PERMISSIONS.LIST_NOTIFICATIONS}>
    <NotificationsPage />
    // </ProtectedRoute>
  );
}

function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const formatDate = (date) => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // --- NEW FUNCTION: handleDelete with confirmation ---
  const handleDelete = (notificationId) => {
    const notificationToDelete = notifications.find((n) => n.id === notificationId);
    if (!notificationToDelete) return;

    // Truncate the message for a cleaner toast
    const truncatedMessage = notificationToDelete.message.length > 50 ? `${notificationToDelete.message.substring(0, 50)}...` : notificationToDelete.message;

    toast.confirmDelete(`Êtes-vous sûr de vouloir supprimer cette notification : "${truncatedMessage}" ?`, async () => {
      try {
        await deleteNotification(notificationId);
        toast.success("Notification supprimée avec succès.");
      } catch (error) {
        // The error toast is already handled in the context, but we can log it here if needed
        console.error("Failed to delete notification:", error);
      }
    });
  };

  const columns = [
    {
      header: "Notification",
      accessor: "message",
      render: (row) => (
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center mr-4 ${!row.read_at ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
            {!row.read_at ? <BellIcon className="w-5 h-5" /> : <EnvelopeOpenIcon className="w-5 h-5" />}
          </div>
          <span className="text-sm text-gray-800 dark:text-dark-text">{row.message}</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(row.created_at)}</span>,
    },
    {
      header: "Statut",
      accessor: "read_at",
      render: (row) =>
        !row.read_at ? (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Non lue</span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Lue</span>
        ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          {!row.read_at && (
            // <PermissionGate permission={PERMISSIONS.MODIFIER_NOTIFICATION}>
            <button onClick={() => markAsRead(row.id)} className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400" title="Marquer comme lu">
              <CheckCircleIcon className="w-5 h-5" />
            </button>
            // </PermissionGate>
          )}
          {/* <PermissionGate permission={PERMISSIONS.SUPPRIMER_NOTIFICATION}> */}
          {/* --- MODIFIED: The onClick now calls our new handleDelete function --- */}
          <button onClick={() => handleDelete(row.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400" title="Supprimer">
            <TrashIcon className="w-5 h-5" />
          </button>
          {/* </PermissionGate> */}
        </div>
      ),
    },
  ];

  const readCount = notifications.length - unreadCount;
  const readPercentage = notifications.length > 0 ? ((readCount / notifications.length) * 100).toFixed(0) : 0;

  const statsCards = [
    { title: "Total des notifications", value: notifications.length.toString(), icon: BellIcon },
    { title: "Notifications non lues", value: unreadCount.toString(), icon: EnvelopeOpenIcon },
    { title: "Taux de lecture", value: `${readPercentage}%`, icon: CheckBadgeIcon },
  ];

  const handleMarkAllAsRead = async () => {
    // This now uses the robust promise from the context
    toast.promise(markAllAsRead(), {
      loading: "Marquage en cours...",
      success: "Toutes les notifications ont été marquées comme lues.",
      error: "Une erreur est survenue.",
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Centre de Notifications"
        description="Consultez et gérez toutes vos notifications"
        actions={[
          {
            children: (
              <span className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Marquer tout comme lu
              </span>
            ),
            variant: "primary",
            onClick: handleMarkAllAsRead,
            disabled: unreadCount === 0 || loading,
            // permission: PERMISSIONS.MODIFIER_NOTIFICATION,
          },
        ]}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      {/* Notifications Table */}
      <Card title="Liste des Notifications">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p>Vous n`&apos;`avez aucune notification.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={notifications} searchable={false} />
        )}
      </Card>
    </div>
  );
}
