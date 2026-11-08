"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BellIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  DocumentIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Card, DataTable, PageHeader, StatsCard } from "../components/ui";
import LoadingSpinner from "../components/LoadingSpinner";
import { PERMISSIONS } from "../constants/permissions";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getDashboardStats, getRecentReservations } from "../services/dashboardService";
import toast from "../utils/toast";

const statusConfig = {
  pending: { text: "En attente", className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300" },
  approved: { text: "Approuvée", className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300" },
  in_progress: { text: "En cours", className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300" },
  rejected: { text: "Rejetée", className: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300" },
  completed: { text: "Terminée", className: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300" },
};

const activityConfig = {
  reservation_submitted: { icon: "📝", className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
  reservation_approved: { icon: "✓", className: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
  reservation_rejected: { icon: "×", className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
  user_registered: { icon: "👤", className: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" },
  new_user_for_admin: { icon: "👥", className: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" },
};

export default function Dashboard() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [summary, setSummary] = useState({
    users: 0,
    rooms: 0,
    equipments: 0,
    documents: 0,
    active_reservations: 0,
    pending_reservations: 0,
    completed_reservations: 0,
    unread_notifications: 0,
  });
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setReservationsLoading(true);

      try {
        const [statsData, reservationsData] = await Promise.all([getDashboardStats(), getRecentReservations(5)]);
        setSummary(statsData);
        setReservations(reservationsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Erreur lors du chargement des données du tableau de bord");
      } finally {
        setLoading(false);
        setReservationsLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = useMemo(() => {
    const actions = [];

    if (hasPermission(PERMISSIONS.CREATE_RESERVATIONS)) {
      actions.push({ label: "Nouvelle Réservation", icon: "📝", path: "/dashboard/mes-reservations?new=1", color: "blue" });
    }
    if (hasPermission(PERMISSIONS.LIST_ALL_RESERVATIONS)) {
      actions.push({ label: "Gérer les Réservations", icon: "📅", path: "/dashboard/reservations", color: "indigo" });
    }
    if (hasPermission(PERMISSIONS.UPLOAD_DOCUMENTS)) {
      actions.push({ label: "Partager un Document", icon: "📄", path: "/dashboard/documents", color: "green" });
    }

    actions.push({ label: "Voir les Notifications", icon: "🔔", path: "/dashboard/notifications", color: "purple" });
    return actions;
  }, [hasPermission]);

  const headerActions = quickActions.slice(0, 2).map((action, index) => ({
    children: action.label,
    variant: index === 0 ? "primary" : "secondary",
    onClick: () => router.push(action.path),
  }));

  const stats = [
    { title: "Utilisateurs", value: summary.users.toLocaleString(), icon: UsersIcon },
    { title: "Salles", value: summary.rooms.toLocaleString(), icon: BuildingOfficeIcon },
    { title: "Équipements", value: summary.equipments.toLocaleString(), icon: ComputerDesktopIcon },
    { title: "Documents", value: summary.documents.toLocaleString(), icon: DocumentIcon },
  ];

  const filteredReservations = reservations.filter((reservation) => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    if (!query) return true;
    return [reservation.room, reservation.professor, reservation.status, reservation.purpose]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase("fr").includes(query));
  });

  const formatDate = (date) =>
    date
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))
      : "—";

  const formatRelativeDate = (date) => {
    const parsed = new Date(date);
    return date && isValid(parsed)
      ? formatDistanceToNow(parsed, { addSuffix: true, locale: fr })
      : "Date inconnue";
  };

  const columns = [
    {
      header: "Salle",
      accessor: "room",
      render: (row) => (
        <button type="button" onClick={() => router.push(row.action_url)} className="flex items-center text-left hover:text-blue-600 dark:hover:text-blue-400">
          <span className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-3">🏢</span>
          {row.room}
        </button>
      ),
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        const config = statusConfig[row.status] || { text: row.status, className: "bg-gray-100 text-gray-800" };
        return <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${config.className}`}>{config.text}</span>;
      },
    },
    { header: "Demandeur", accessor: "professor" },
    { header: "Date", accessor: "start_time", render: (row) => formatDate(row.start_time) },
  ];

  const quickActionClasses = {
    blue: "from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
    indigo: "from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700",
    green: "from-green-500 to-green-600 dark:from-green-600 dark:to-green-700",
    purple: "from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700",
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour, ${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
        description="Voici l’état actuel de votre espace EduSpace"
        actions={headerActions}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <StatsCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Statistiques Rapides">
          <div className="space-y-5">
            {[
              ["Réservations actives", summary.active_reservations, "text-blue-600 dark:text-blue-400"],
              ["Réservations en attente", summary.pending_reservations, "text-amber-600 dark:text-amber-400"],
              ["Notifications non lues", unreadCount, "text-purple-600 dark:text-purple-400"],
            ].map(([label, value, className]) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                <p className={`text-xl font-semibold ${className}`}>{loading ? "—" : value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Activité Récente">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente.</p>
            ) : (
              notifications.slice(0, 3).map((notification) => {
                const config = activityConfig[notification.data?.event] || {
                  icon: "🔔",
                  className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                };

                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => router.push(notification.data?.action_url || "/dashboard/notifications")}
                    className="w-full flex items-center text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors"
                  >
                    <span className={`w-8 h-8 rounded-full ${config.className} flex items-center justify-center mr-3 flex-shrink-0 text-xs`}>{config.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm text-gray-800 dark:text-gray-200 truncate">{notification.message}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{formatRelativeDate(notification.created_at)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card title="Actions Rapides">
          <div className="space-y-3">
            {quickActions.map((action) => (
              <button
                type="button"
                key={action.path}
                onClick={() => router.push(action.path)}
                className={`w-full py-3 px-4 bg-gradient-to-r ${quickActionClasses[action.color]} text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center`}
              >
                <span className="mr-2">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Réservations récentes">
        {reservationsLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredReservations}
            searchable
            onSearch={setSearchQuery}
            searchPlaceholder="Rechercher une réservation..."
          />
        )}
      </Card>
    </div>
  );
}
