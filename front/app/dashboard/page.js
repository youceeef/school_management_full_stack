"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isValid } from "date-fns";
import { fr, enUS, arTN } from "date-fns/locale";
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
import { useLanguage } from "../context/LanguageContext";
import { getDashboardStats, getRecentReservations } from "../services/dashboardService";
import { getAccountRequestCounts } from "../services/accountRequestService";
import toast from "../utils/toast";

const DATE_LOCALES = { fr, en: enUS, ar: arTN };

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
  account_approval_required: {
    icon: UserPlusIcon,
    className: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60",
  },
  account_approved: {
    icon: CheckCircleIcon,
    className: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60",
  },
  account_approval_resubmitted: {
    icon: ClockIcon,
    className: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/60",
  },
  account_reactivated: {
    icon: CheckCircleIcon,
    className: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60",
  },
  account_rejected: {
    icon: XCircleIcon,
    className: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-900/60",
  },
  account_suspended: {
    icon: XCircleIcon,
    className: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60",
  },
};

export default function Dashboard() {
  const router = useRouter();
  const { user, hasPermission, hasRole } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);
  const { notifications, unreadCount } = useNotifications();
  const { locale, dateLocale, t, tr, isRtl } = useLanguage();
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
        toast.error(tr("Erreur lors du chargement des données du tableau de bord"));
      } finally {
        setLoading(false);
        setReservationsLoading(false);
      }
    };

    fetchData();
  }, [tr]);

  const quickActions = useMemo(() => {
    const actions = [];

    if (hasRole("admin")) {
      actions.push({
        label: "Centre d'approbation",
        description: "Valider les comptes du personnel",
        icon: UserPlusIcon,
        path: "/dashboard/account-requests",
      });
    }

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
  }, [hasPermission, hasRole]);

  const headerActions = quickActions.slice(0, 2).map((action, index) => ({
    children: tr(action.label),
    icon: action.icon,
    variant: index === 0 ? "primary" : "secondary",
    onClick: () => router.push(action.path),
  }));

  const stats = [
    {
      title: "Utilisateurs actifs",
      value: (summary.users ?? 0).toLocaleString(dateLocale),
      icon: UsersIcon,
    },
    {
      title: "Salles & Laboratoires",
      value: (summary.rooms ?? 0).toLocaleString(dateLocale),
      icon: BuildingOfficeIcon,
    },
    {
      title: "Équipements recensés",
      value: (summary.equipments ?? 0).toLocaleString(dateLocale),
      icon: ComputerDesktopIcon,
    },
    {
      title: "Documents partagés",
      value: (summary.documents ?? 0).toLocaleString(dateLocale),
      icon: DocumentTextIcon,
    },
  ];

  const filteredReservations = reservations.filter((reservation) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [reservation.room, reservation.professor, reservation.status, reservation.purpose]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const formatDate = (date) =>
    date
      ? new Intl.DateTimeFormat(dateLocale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date))
      : "—";

  const formatRelativeDate = (date) => {
    const parsed = new Date(date);
    return date && isValid(parsed)
      ? formatDistanceToNow(parsed, { addSuffix: true, locale: DATE_LOCALES[locale] || fr })
      : tr("Date inconnue");
  };

  const columns = [
    {
      header: "Salle",
      accessor: "room",
      render: (row) => (
        <button
          type="button"
          onClick={() => router.push(row.action_url)}
          className="flex items-center gap-3 text-start group"
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
            {tr(config.text)}
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

  const greetingName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || tr("Utilisateur");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.welcomeTitle", { name: greetingName })}
        description="Vue d’ensemble opérationnelle de vos réservations, ressources et documents pédagogiques."
        actions={headerActions}
      />

      {pendingRequests > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserPlusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {pendingRequests === 1
                  ? tr("1 demande de compte en attente d'approbation.")
                  : `${pendingRequests} ${tr("demandes de compte en attente d'approbation.")}`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {tr("Examinez et validez les comptes avant de leur attribuer des accès aux ressources.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/account-requests")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
          >
            {tr("Examiner les demandes")}
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                  <span className="text-sm text-slate-600 dark:text-slate-400">{tr(item.label)}</span>
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
                  {tr("Aucune activité récente enregistrée.")}
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
                    className="w-full flex items-start gap-3 text-start hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg p-2.5 transition-colors"
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
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center justify-between text-start group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0">
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tr(action.label)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {tr(action.description)}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon
                    className={`w-4 h-4 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 shrink-0 ${
                      isRtl ? "mr-2 rotate-180" : "ml-2"
                    } transition-colors`}
                  />
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
