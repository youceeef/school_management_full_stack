"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRightIcon,
  BellIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Card, DataTable, PageHeader, StatsCard } from "../components/ui";
import LoadingSpinner from "../components/LoadingSpinner";
import { PERMISSIONS } from "../constants/permissions";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getDashboardStats, getRecentReservations } from "../services/dashboardService";
import toast from "../utils/toast";

const statusConfig = {
  pending: {
    text: "En attente",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  approved: {
    text: "Approuvée",
    dotClass: "bg-primary-600 dark:bg-primary-400",
    textClass: "text-primary-700 dark:text-primary-300",
  },
  in_progress: {
    text: "En cours",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    text: "Rejetée",
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-300",
  },
  completed: {
    text: "Terminée",
    dotClass: "bg-slate-400 dark:bg-slate-500",
    textClass: "text-slate-600 dark:text-slate-400",
  },
};

const activityConfig = {
  reservation_submitted: {
    icon: ClockIcon,
    className: "bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-primary-200/60 dark:border-primary-900/60",
  },
  reservation_approved: {
    icon: CheckCircleIcon,
    className: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60",
  },
  reservation_rejected: {
    icon: XCircleIcon,
    className: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-900/60",
  },
  user_registered: {
    icon: UserPlusIcon,
    className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  new_user_for_admin: {
    icon: UsersIcon,
    className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
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
        const [statsData, reservationsData] = await Promise.all([
          getDashboardStats(),
          getRecentReservations(5),
        ]);
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
      actions.push({
        label: "Nouvelle réservation",
        description: "Réserver une salle ou du matériel",
        icon: PlusIcon,
        path: "/dashboard/mes-reservations?new=1",
      });
    }
    if (hasPermission(PERMISSIONS.LIST_ALL_RESERVATIONS)) {
      actions.push({
        label: "Gérer les réservations",
        description: "Examiner et valider les demandes",
        icon: CalendarDaysIcon,
        path: "/dashboard/reservations",
      });
    }
    if (hasPermission(PERMISSIONS.UPLOAD_DOCUMENTS)) {
      actions.push({
        label: "Partager un document",
        description: "Publier un support pédagogique",
        icon: DocumentArrowUpIcon,
        path: "/dashboard/documents",
      });
    }

    actions.push({
      label: "Centre de notifications",
      description: "Consulter les alertes récentes",
      icon: BellIcon,
      path: "/dashboard/notifications",
    });
    return actions;
  }, [hasPermission]);

  const headerActions = quickActions.slice(0, 2).map((action, index) => ({
    children: action.label,
    icon: action.icon,
    variant: index === 0 ? "primary" : "secondary",
    onClick: () => router.push(action.path),
  }));

  const stats = [
    {
      title: "Utilisateurs actifs",
      value: (summary.users ?? 0).toLocaleString("fr-FR"),
      icon: UsersIcon,
    },
    {
      title: "Salles & Laboratoires",
      value: (summary.rooms ?? 0).toLocaleString("fr-FR"),
      icon: BuildingOfficeIcon,
    },
    {
      title: "Équipements recensés",
      value: (summary.equipments ?? 0).toLocaleString("fr-FR"),
      icon: ComputerDesktopIcon,
    },
    {
      title: "Documents partagés",
      value: (summary.documents ?? 0).toLocaleString("fr-FR"),
      icon: DocumentTextIcon,
    },
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
      ? new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date))
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
        <button
          type="button"
          onClick={() => router.push(row.action_url)}
          className="flex items-center gap-3 text-left group"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:border-primary-300 dark:group-hover:border-primary-700 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <BuildingOfficeIcon className="w-4 h-4" />
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {row.room}
          </span>
        </button>
      ),
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        const config = statusConfig[row.status] || {
          text: row.status,
          dotClass: "bg-slate-400",
          textClass: "text-slate-700 dark:text-slate-300",
        };
        return (
          <span className={`inline-flex items-center gap-2 text-xs font-medium ${config.textClass}`}>
            <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
            {config.text}
          </span>
        );
      },
    },
    {
      header: "Demandeur",
      accessor: "professor",
      render: (row) => (
        <span className="text-slate-700 dark:text-slate-300">{row.professor || "—"}</span>
      ),
    },
    {
      header: "Créneau",
      accessor: "start_time",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
          {formatDate(row.start_time)}
        </span>
      ),
    },
  ];

  const greetingName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Utilisateur";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour, ${greetingName}`}
        description="Vue d’ensemble opérationnelle de vos réservations, ressources et documents pédagogiques."
        actions={headerActions}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Indicateurs en temps réel" subtitle="Suivi immédiat des demandes">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {[
              {
                label: "Réservations actives",
                value: summary.active_reservations ?? 0,
                dot: "bg-emerald-500",
                valueClass: "text-slate-900 dark:text-white",
              },
              {
                label: "Demandes en attente",
                value: summary.pending_reservations ?? 0,
                dot: "bg-amber-500",
                valueClass: "text-amber-600 dark:text-amber-400",
              },
              {
                label: "Sessions terminées",
                value: summary.completed_reservations ?? 0,
                dot: "bg-slate-400",
                valueClass: "text-slate-700 dark:text-slate-300",
              },
              {
                label: "Notifications non lues",
                value: unreadCount ?? 0,
                dot: "bg-primary-600",
                valueClass: "text-primary-600 dark:text-primary-400",
              },
            ].map((item) => (
              <div key={item.label} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
                <span className={`text-lg font-mono font-semibold tabular-nums ${item.valueClass}`}>
                  {loading ? "—" : item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Activité récente" subtitle="Dernières notifications reçues">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <BellIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune activité récente enregistrée.
                </p>
              </div>
            ) : (
              notifications.slice(0, 4).map((notification) => {
                const config = activityConfig[notification.data?.event] || {
                  icon: BellIcon,
                  className:
                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                };
                const IconComponent = config.icon;

                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() =>
                      router.push(notification.data?.action_url || "/dashboard/notifications")
                    }
                    className="w-full flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg p-2.5 transition-colors"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg border ${config.className} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {notification.message}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatRelativeDate(notification.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card title="Accès directs" subtitle="Raccourcis fréquents">
          <div className="space-y-2.5">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  type="button"
                  key={action.path}
                  onClick={() => router.push(action.path)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0">
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {action.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 shrink-0 ml-2 transition-colors" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card
        title="Réservations récentes"
        subtitle="Les 5 dernières demandes enregistrées sur la plateforme"
        noPadding
      >
        {reservationsLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="p-6">
            <DataTable
              columns={columns}
              data={filteredReservations}
              searchable
              onSearch={setSearchQuery}
              searchPlaceholder="Rechercher par salle, demandeur ou motif..."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
